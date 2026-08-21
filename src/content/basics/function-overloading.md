---
id: function-overloading
topic: Basics
title: Function Overloading
difficulty: Medium
status: ready
prerequisites:
  - functions-declaration-and-calling
  - function-parameters-and-return-values
  - pass-by-value-vs-pass-by-reference
  - data-types
  - type-conversion-and-casting
relatedIds:
  - function-parameters-and-return-values
  - functions-declaration-and-calling
  - pass-by-value-vs-pass-by-reference
  - type-conversion-and-casting
---

<!-- @summary -->
Several functions sharing one name, told apart by their parameters — how the compiler picks between them, and why Python replaces them instead of choosing.

<!-- @theory -->
## One name, several versions

Some operations are the same idea applied to different inputs. Adding two integers and
adding two decimals are conceptually one operation. Naming them `addInts` and
`addDoubles` forces the caller to track a distinction they do not care about.

**Overloading** lets several functions share a name, distinguished by their
parameters:

```
int    add(int a, int b);
double add(double a, double b);
int    add(int a, int b, int c);
```

The caller writes `add(...)` and the compiler picks the version matching the
arguments. All three exist independently; nothing is overwritten.

## The signature is the name plus the parameters

What distinguishes one overload from another:

- **The number of parameters** — `add(int, int)` versus `add(int, int, int)`
- **The types of parameters** — `add(int, int)` versus `add(double, double)`
- **The order of types** — `f(int, string)` versus `f(string, int)`

What does **not** count:

- **The return type.** `int f()` and `double f()` are not valid overloads.
- **Parameter names.** `f(int a)` and `f(int b)` are the same function.

## Why the return type cannot distinguish overloads

This trips people up because it feels like it should work.

The compiler picks the overload from the **call site**, using only the arguments. But
a call can legally ignore its return value:

```
f();     // which one? int f() or double f()?
```

There is nothing to decide on. Even when the result *is* used, resolution would depend
on context in a way that quickly becomes ambiguous. So both C++ and Java reject it
outright — a compile error, not a subtle bug.

**Rule: if two functions differ only in return type, they are not overloads.**

## What else fails to distinguish (C++)

Worth knowing, because two of these look like they should work:

- **By value versus by reference.** `f(int)` and `f(int&)` do not overload. The
  previous subtopic showed these behave completely differently, yet the call site
  looks identical, so the compiler cannot choose.
- **Pointer versus array.** `f(int*)` and `f(int[])` are the same declaration.
- **A top-level const on a value parameter.** `f(int)` and `f(const int)` are the
  same, since the copy's constness is invisible to the caller.

## How the compiler chooses

Given a call, the compiler collects every function with that name and works through
them in order of preference:

1. **Exact match.** The argument types match a candidate exactly. Done.
2. **Promotion.** A smaller type widens to a larger one — `char` to `int`, `float`
   to `double`. Preferred over a general conversion.
3. **Standard conversion.** `int` to `double`, and similar.
4. **No match, or two equally good matches** → **compile error.**

That last case is the one to watch:

```
void f(int x);
void f(double x);

f(5);      // exact match on int — fine
f(5.0);    // exact match on double — fine
f('a');    // char promotes to int — fine
f(5L);     // long converts equally well to both — AMBIGUOUS
```

An ambiguity is a compile error, not a coin flip. The fix is to cast at the call site
or add an exact-matching overload.

## Overloading combined with default arguments

Both C++ and Python allow default arguments, and mixing them with overloads creates
ambiguity easily:

```
void f(int a, int b = 0);
void f(int a);

f(5);      // AMBIGUOUS — both are viable
```

If you have defaults, you usually do not also need overloads for the same shapes.
Pick one mechanism.

## Java uses overloading as its default arguments

Java has **no default arguments at all** — established in subtopic 18. Overloading is
the substitute, and the standard pattern is a chain where each shorter version calls
the longer one:

```
void greet(String name)                            { greet(name, "Hello"); }
void greet(String name, String greeting)           { greet(name, greeting, '!'); }
void greet(String name, String greeting, char p)   { ... }   // the real one
```

Only the last has a body. This is why Java libraries routinely carry four or five
versions of the same method name — it is one method with optional parameters, spelled
out.

## Python does not support overloading

Third construct in this module Python simply lacks, after `switch` and `do-while`.

A `def` is a **statement that binds a name**. A second `def` with the same name
rebinds it — exactly like assigning a variable twice. The first function is not
overloaded; it is **gone**.

```
def add(a, b):
    return a + b

def add(a, b, c):        # replaces the first one entirely
    return a + b + c

add(1, 2)                # TypeError: add() missing 1 required argument
```

**No error is reported at the definition.** The failure appears later, at a call that
used to work. That silence makes it worse than a compile error — a merge that brings
two same-named functions into one module breaks calls with no warning at all.

Python's substitutes, in rough order of preference:

**Default arguments** — cleanest when the versions differ only in argument count.

**`*args`** — accept any number and branch on `len(args)`. Works, and gets messy fast.

**`isinstance` checks** — branch on argument types inside one function. Explicit, but
you are hand-writing the dispatch the compiler would do.

**`functools.singledispatch`** — the standard-library decorator that genuinely
dispatches on the first argument's type. The closest thing to real overloading, and
the right tool when the versions differ by type rather than count.

## Overloading is not overriding

These get confused, and the distinction is worth stating once:

- **Overloading** — several functions, one name, **different parameters**, chosen by
  the **compiler** from the call site. That is this subtopic.
- **Overriding** — a subclass replacing an inherited method with the **same**
  parameters, chosen at **runtime** by the object's actual type. That belongs to
  object-oriented programming.

Same name, opposite mechanisms: one is resolved before the program runs, the other
while it runs.

## When to use it

Overload when the versions are genuinely **the same operation on different inputs** —
`print` for an int, a double, or a string. The caller benefits from not having to
remember three names.

Do not overload when the versions do different things. Two functions named `process`
that behave differently for an `int` and a `string` are two functions wearing one
name, and the shared name actively misleads the reader.

<!-- @intuition -->
Overloading is one name pointing at a small menu, and the compiler reads the arguments to order for you. Python has no menu — a name holds exactly one function, so writing a second one does not add a dish, it replaces the meal.

<!-- @approach -->
### Overloading by Parameter List

<!-- @idea -->
Define several functions sharing a name, distinguished by how many parameters they take or what types those are.

<!-- @steps -->
1. Confirm the versions are the same operation applied to different inputs, rather than different operations.
2. Write each version with the same name and a different parameter list.
3. Vary the count, the types, or the order of types — anything else will not distinguish them.
4. Do not rely on the return type or the parameter names, since neither is part of the signature.
5. Call the shared name with the arguments you have, and the compiler selects the matching version.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

// Different parameter TYPES
int add(int a, int b) {
    cout << "int version: ";
    return a + b;
}

double add(double a, double b) {
    cout << "double version: ";
    return a + b;
}

// Different parameter COUNT
int add(int a, int b, int c) {
    cout << "three-arg version: ";
    return a + b + c;
}

// Different ORDER of types
void show(int n, string s) { cout << n << s << endl; }
void show(string s, int n) { cout << s << n << endl; }

int main() {
    cout << add(2, 3) << endl;         // int version: 5
    cout << add(2.5, 3.5) << endl;     // double version: 6
    cout << add(1, 2, 3) << endl;      // three-arg version: 6

    show(1, "a");    // 1a
    show("a", 1);    // a1

    // INVALID — return type is not part of the signature
    // double add(int a, int b);
    // error: functions that differ only in their return type cannot be overloaded

    // INVALID — by value and by reference do not distinguish
    // void f(int x);
    // void f(int& x);
    // error: redefinition

    return 0;
}
```

<!-- @annotations -->
- 6: Three genuinely separate functions. Nothing here overwrites anything.
- 23: Order counts, so these two are distinct signatures even with identical types.
- 36: Surprising after the previous subtopic — the two behave very differently, yet the call site cannot tell them apart.

<!-- @code java -->
```java
public class Overload {

    // Different parameter types
    static int add(int a, int b) {
        System.out.print("int version: ");
        return a + b;
    }

    static double add(double a, double b) {
        System.out.print("double version: ");
        return a + b;
    }

    // Different parameter count
    static int add(int a, int b, int c) {
        return a + b + c;
    }

    // THE JAVA PATTERN — overloading standing in for default arguments
    static void greet(String name) {
        greet(name, "Hello");                 // delegate
    }

    static void greet(String name, String greeting) {
        greet(name, greeting, '!');           // delegate
    }

    static void greet(String name, String greeting, char punct) {
        System.out.println(greeting + ", " + name + punct);   // the only real body
    }

    public static void main(String[] args) {
        System.out.println(add(2, 3));        // int version: 5
        System.out.println(add(2.5, 3.5));    // double version: 6.0

        greet("Ana");                          // Hello, Ana!
        greet("Ana", "Welcome");               // Welcome, Ana!
        greet("Ana", "Welcome", '.');          // Welcome, Ana.
    }

    // INVALID — differs only in return type
    // static double add(int a, int b) { return a + b; }
    // error: method add(int,int) is already defined
}
```

<!-- @annotations -->
- 21: Java has no default arguments, so this chain is how optional parameters are expressed.
- 29: Only the fullest version contains logic. The others exist purely to supply defaults.

<!-- @code python -->
```python
# Python does NOT support overloading. A second def REPLACES the first.

def add(a, b):
    return a + b

def add(a, b, c):          # this silently replaces the version above
    return a + b + c

# print(add(2, 3))
# TypeError: add() missing 1 required positional argument: 'c'

# No error was reported at the definition. The failure appears at a call
# that used to work — which is why this is worse than a compile error.

# Proof that def is just a name binding, like an assignment:
def f(): return 1
def f(): return 2
print(f())                 # 2 — the first is gone entirely

print(add)                 # <function add at 0x...> — ONE function, not a set

# WORKAROUND 1 — default arguments (cleanest when only the count varies)
def add(a, b, c=0):
    return a + b + c

print(add(2, 3))           # 5
print(add(2, 3, 4))        # 9
```

<!-- @annotations -->
- 6: No warning of any kind. The name is simply rebound, exactly as x = 1 then x = 2 would be.
- 17: The name holds a single function object. There is no candidate set for anything to choose from.

<!-- @approach -->
### How the Compiler Chooses

<!-- @idea -->
Follow the resolution order from exact match to conversion, and recognise when two candidates tie.

<!-- @steps -->
1. Collect every function sharing the called name.
2. Discard any whose parameter count cannot match the arguments supplied.
3. Prefer a candidate whose parameter types match the arguments exactly.
4. If none matches exactly, prefer a promotion of a smaller type to a larger one.
5. Otherwise accept a standard conversion, such as an integer to a floating-point value.
6. If no candidate is viable, or two are equally good, the compiler reports an error rather than guessing.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void f(int x)    { cout << "int" << endl; }
void f(double x) { cout << "double" << endl; }

int main() {
    f(5);        // int      — exact match
    f(5.0);      // double   — exact match
    f('a');      // int      — char PROMOTES to int, preferred over converting
    f(true);     // int      — bool promotes to int

    // AMBIGUOUS — long converts equally well to int and to double
    // f(5L);
    // error: call of overloaded 'f(long int)' is ambiguous

    // FIX 1 — cast at the call site to force an exact match
    f((int) 5L);     // int

    // FIX 2 — add an exact overload
    // void f(long x);

    return 0;
}

// A separate ambiguity: defaults overlapping with an overload
void g(int a, int b = 0);
void g(int a);
// g(5);   // error: call of overloaded 'g(int)' is ambiguous
//         // both candidates accept exactly one argument
```

<!-- @annotations -->
- 10: Promotion beats conversion in the ranking, which is why char lands on the int version.
- 14: A tie is an error, not a coin flip. The compiler refuses to guess.
- 27: Having both a default argument and an overload covering the same call is the easiest way to create a tie.

<!-- @code java -->
```java
public class Resolution {

    static void f(int x)    { System.out.println("int"); }
    static void f(double x) { System.out.println("double"); }
    static void f(Object x) { System.out.println("Object"); }

    public static void main(String[] args) {
        f(5);        // int    — exact match
        f(5.0);      // double — exact match
        f('a');      // int    — char widens to int, preferred over double
        f("text");   // Object — no closer candidate exists

        // Java prefers, in order: exact match, then widening,
        // then autoboxing, then varargs.
        // It will widen int to double before boxing int to Integer.
    }

    // INVALID — differs only in return type
    // static int f(int x) { return x; }
    // error: method f(int) is already defined
}
```

<!-- @annotations -->
- 10: char widens to int before it would widen to double, so the nearer type wins.
- 14: Java's ranking has an extra step C++ lacks, because of boxing between primitives and wrapper types.

<!-- @code python -->
```python
# There is no resolution step in Python — the name holds one function.
# Anything resembling dispatch has to be written by hand.

# WORKAROUND 2 — *args, branching on how many arrived
def add(*args):
    if len(args) == 2:
        return args[0] + args[1]
    elif len(args) == 3:
        return args[0] + args[1] + args[2]
    raise TypeError("add() takes 2 or 3 arguments")

print(add(2, 3))       # 5
print(add(2, 3, 4))    # 9

# WORKAROUND 3 — isinstance, branching on type
def describe(value):
    if isinstance(value, int):
        return f"int: {value}"
    elif isinstance(value, str):
        return f"string of length {len(value)}"
    elif isinstance(value, list):
        return f"list of {len(value)} items"
    raise TypeError("unsupported type")

print(describe(5))          # int: 5
print(describe("hello"))    # string of length 5

# WORKAROUND 4 — singledispatch, the closest thing to real overloading
from functools import singledispatch

@singledispatch
def area(shape):
    raise TypeError("unsupported shape")

@area.register
def _(shape: int):          # dispatches on the first argument's type
    return shape * shape

@area.register
def _(shape: float):
    return 3.14159 * shape * shape

print(area(4))      # 16
print(area(2.0))    # 12.56636
```

<!-- @annotations -->
- 6: Hand-written dispatch. It works and grows unpleasant as the cases multiply.
- 17: Explicit and readable for a few types, but this is the work a compiler would have done for free.
- 31: singledispatch keeps separate implementations and routes by type, which is genuine dispatch rather than branching.

<!-- @approach -->
### Python's Alternatives in Practice

<!-- @idea -->
Pick the substitute matching what actually varies between the versions.

<!-- @steps -->
1. Determine whether the versions differ by argument count, by argument type, or by both.
2. If only the count varies, use default arguments — the simplest and most readable option.
3. If the count varies widely or unpredictably, accept *args and branch on its length.
4. If the type varies and there are only two or three cases, branch with isinstance inside one function.
5. If the type varies across several cases, use functools.singledispatch to keep the implementations separate.
6. Never define two functions with the same name expecting both to survive.

<!-- @code python -->
```python
from functools import singledispatch

# COUNT VARIES — default arguments
def make_greeting(name, greeting="Hello", punct="!"):
    return f"{greeting}, {name}{punct}"

print(make_greeting("Ana"))                      # Hello, Ana!
print(make_greeting("Ana", "Welcome"))           # Welcome, Ana!
print(make_greeting("Ana", punct="."))           # Hello, Ana.

# COUNT VARIES WIDELY — *args
def total(*numbers):
    return sum(numbers)

print(total())              # 0
print(total(1, 2, 3, 4))    # 10

# TYPE VARIES, FEW CASES — isinstance
def stringify(value):
    if isinstance(value, list):
        return ", ".join(str(v) for v in value)
    if isinstance(value, dict):
        return ", ".join(f"{k}={v}" for k, v in value.items())
    return str(value)

print(stringify([1, 2, 3]))          # 1, 2, 3
print(stringify({"a": 1}))           # a=1
print(stringify(42))                 # 42

# TYPE VARIES, MANY CASES — singledispatch
@singledispatch
def summarise(data):
    return f"unsupported: {type(data).__name__}"

@summarise.register
def _(data: list):
    return f"list with {len(data)} items"

@summarise.register
def _(data: str):
    return f"string of {len(data)} characters"

@summarise.register
def _(data: int):
    return f"number {data}"

print(summarise([1, 2]))    # list with 2 items
print(summarise("hi"))      # string of 2 characters
print(summarise(7))         # number 7
print(summarise(3.5))       # unsupported: float
```

<!-- @annotations -->
- 9: Keyword arguments let a middle parameter be skipped, which overloading in C++ and Java cannot do.
- 33: Each registered version stays a separate function, so adding a type does not touch the existing ones.
- 48: The base implementation acts as the fallback when no registered type matches.

<!-- @code cpp -->
```cpp
// For comparison — C++ expresses the same intents natively

#include <string>
#include <vector>
using namespace std;

// COUNT VARIES — default arguments, no overloads needed
string makeGreeting(string name, string greeting = "Hello", char punct = '!') {
    return greeting + ", " + name + punct;
}

// COUNT VARIES WIDELY — an initializer list
int total(initializer_list<int> numbers) {
    int sum = 0;
    for (int n : numbers) sum += n;
    return sum;
}
// total({1, 2, 3, 4});   // 10

// TYPE VARIES — this is what overloading is for
string stringify(int value)    { return to_string(value); }
string stringify(double value) { return to_string(value); }
string stringify(const vector<int>& values) {
    string result;
    for (int v : values) result += to_string(v) + " ";
    return result;
}
// The compiler routes each call, with no branching written by hand.
```

<!-- @annotations -->
- 21: Three separate implementations with no dispatch code, which is what Python's singledispatch reconstructs.

<!-- @code java -->
```java
// For comparison — Java leans on overloading for both roles

public class Alternatives {

    // COUNT VARIES — the delegation chain, since Java has no defaults
    static String makeGreeting(String name) {
        return makeGreeting(name, "Hello", '!');
    }
    static String makeGreeting(String name, String greeting) {
        return makeGreeting(name, greeting, '!');
    }
    static String makeGreeting(String name, String greeting, char punct) {
        return greeting + ", " + name + punct;
    }

    // COUNT VARIES WIDELY — varargs
    static int total(int... numbers) {
        int sum = 0;
        for (int n : numbers) sum += n;
        return sum;
    }

    // TYPE VARIES — genuine overloading
    static String stringify(int value)      { return String.valueOf(value); }
    static String stringify(double value)   { return String.valueOf(value); }
    static String stringify(int[] values)   {
        StringBuilder sb = new StringBuilder();
        for (int v : values) sb.append(v).append(" ");
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(makeGreeting("Ana"));   // Hello, Ana!
        System.out.println(total(1, 2, 3, 4));     // 10
        System.out.println(stringify(42));         // 42
    }
}
```

<!-- @annotations -->
- 6: Java uses overloading for two different jobs, which is why its method lists are long.

<!-- @example -->

<!-- @input -->
add(int, int), add(double, double) and add(int, int, int) defined; call add(2, 3)

<!-- @output -->
The two-integer version runs

<!-- @why -->
Shows resolution as a filter followed by a ranking, which is what makes ambiguity errors understandable rather than arbitrary.

<!-- @walkthrough -->
1. The compiler collects all three functions named add.
2. The three-parameter version is discarded immediately, since only two arguments were supplied.
3. Two candidates remain, both accepting two parameters.
4. The integer version matches the argument types exactly, with no conversion required.
5. The double version would require converting both arguments, which ranks below an exact match.
6. The integer version is selected, and this decision is made entirely at compile time.

<!-- @example -->

<!-- @input -->
void f(int) and void f(double) defined; call f(5L) with a long argument

<!-- @output -->
Compile error: the call is ambiguous

<!-- @why -->
Ambiguity is a compile error rather than a silent choice, which is the behaviour you want and the reason overload sets should stay small.

<!-- @walkthrough -->
1. Both candidates accept one argument, so neither is discarded on count.
2. Neither matches a long exactly, so no candidate wins outright.
3. Converting a long to an int is a standard conversion.
4. Converting a long to a double is also a standard conversion, at the same rank.
5. Two candidates are equally good, so the compiler has no basis to choose between them.
6. It reports an ambiguity rather than picking one, and the fix is a cast at the call site or an exact overload.

<!-- @example -->

<!-- @input -->
Two Python functions both named add, defined one after the other

<!-- @output -->
The second replaces the first, with no error at definition

<!-- @why -->
The silence is the danger. Merging two modules that each define the same function name breaks calls with no warning anywhere.

<!-- @walkthrough -->
1. The first def executes and binds the name add to a function object.
2. The second def executes and binds the same name to a different function object.
3. This is a rebinding, exactly like assigning to a variable twice — the first object is discarded.
4. Nothing is reported, because redefining a name is entirely legal Python.
5. Calling add with the original argument count now raises TypeError, since only the newer function exists.
6. The failure surfaces at a call site that previously worked, far from the definition that caused it.

<!-- @example -->

<!-- @input -->
Attempting to overload on return type alone: int f() and double f()

<!-- @output -->
Compile error in both C++ and Java

<!-- @why -->
A rule students reach for constantly, and the reason it cannot work is more useful than memorising that it does not.

<!-- @walkthrough -->
1. The compiler chooses an overload using only the call site's arguments.
2. Both candidates take no arguments, so the argument list distinguishes nothing.
3. A call may legally discard its return value, so there is not always a context to select from.
4. Even when the result is used, resolving by expected type would quickly become ambiguous.
5. Both languages therefore reject the declarations outright rather than defining rules for it.
6. Giving the functions different names is the correct fix, since they genuinely produce different things.

<!-- @visualization code-flow -->

<!-- @description -->
Draw the overload set as a stack of candidate cards beneath the shared name, each card showing one parameter list. When a call arrives, animate its arguments as tiles moving toward the stack, then run resolution as two visible stages. First a FILTER stage: cards whose parameter count cannot accept this many arguments slide out and grey away, so it is clear they were eliminated before any type was considered. Then a RANK stage: each surviving card is scored against the arguments and drawn on a ladder with exact match on the top rung, promotion below it, and standard conversion below that, with a small badge on each card naming which rung it landed on. The single highest card lights green and its body is entered. Replay with an argument that lands two cards on the same rung — draw both lighting amber at equal height with no card above them, and the whole panel resolving to a compile error rather than either being chosen, which makes ambiguity read as a tie rather than as a failure to find anything. Emphasise throughout that this entire process happens before the program runs, by drawing it on a compile-time band separate from the execution track below. Then the PYTHON panel, which is deliberately a different shape: draw a single name slot holding exactly one function object, with no stack and no ladder anywhere. Execute the first def and animate a function object being created and the name binding to it. Execute the second def and animate a second object being created and the same binding swinging across to it, while the first object detaches and fades out unreferenced — with no error marker appearing at any point. Finish by firing a call with the original argument count and showing it reach the only remaining object and fail there, with a line tracing the failure back to the definition that quietly replaced it.

<!-- @sampleInput -->
```json
{"overloadSet":[{"params":["int","int"],"id":"A"},{"params":["double","double"],"id":"B"},{"params":["int","int","int"],"id":"C"}],"calls":[{"args":["int","int"],"filtered":["C"],"ranked":[{"id":"A","rung":"exact"},{"id":"B","rung":"conversion"}],"winner":"A"},{"args":["long"],"set":[{"params":["int"],"id":"D"},{"params":["double"],"id":"E"}],"ranked":[{"id":"D","rung":"conversion"},{"id":"E","rung":"conversion"}],"winner":null,"result":"ambiguous"}],"rungs":["exact","promotion","conversion"],"python":{"nameSlot":"add","defs":[{"params":["a","b"],"object":"obj1"},{"params":["a","b","c"],"object":"obj2"}],"afterSecondDef":{"bound":"obj2","orphaned":"obj1","errorReported":false},"call":{"args":2,"reaches":"obj2","result":"TypeError"}}}
```

<!-- @highlights -->
- The overload set is drawn as a stack of candidate cards beneath one shared name, each showing its parameter list.
- A call arrives and its argument tiles move toward the stack.
- The filter stage slides out every card whose parameter count cannot accept this many arguments, greying them away.
- The rank stage places each surviving card on a ladder: exact match on top, promotion beneath, conversion below that.
- The two-integer card lands on the exact rung while the double card lands on conversion, so the top card lights green.
- The whole process is drawn on a compile-time band above the execution track, since it happens before the program runs.
- Replayed with a long argument, both cards land on the same conversion rung at equal height.
- Neither sits above the other, so both light amber and the panel resolves to a compile error rather than choosing.
- The Python panel is a different shape entirely: one name slot holding exactly one function object, with no stack and no ladder.
- The first def creates a function object and binds the name to it.
- The second def creates another object and swings the same binding across, while the first detaches and fades out unreferenced.
- No error marker appears anywhere during that replacement, which is what makes it dangerous.
- A call with the original argument count reaches the only remaining object and fails there, traced back to the definition that replaced it.

<!-- @edgeCases -->
- Two functions differing only in return type, which both C++ and Java reject as duplicate definitions.
- Two C++ functions differing only in by-value versus by-reference parameters, which do not overload.
- Two C++ functions differing only in pointer versus array parameter notation, which are the same declaration.
- An argument type converting equally well to two candidates, which is a compile error rather than a choice.
- An overload set combined with default arguments where one call matches more than one candidate.
- A char argument with both int and double overloads available, which promotes to int rather than converting to double.
- A Java call where widening and autoboxing are both possible, where widening is preferred.
- A Python module that imports a function and then defines one with the same name, silently replacing the import.
- A Python class defining two methods with the same name, where only the last survives with no warning.
- A singledispatch function called with a type that has no registered implementation, which falls back to the base version.

<!-- @pitfalls -->
- Trying to overload on return type alone, which is rejected in both C++ and Java.
- Assuming Python supports overloading, when a second definition silently replaces the first.
- Defining a Python function whose name matches an import, which replaces it with no warning.
- Overloading in C++ on by-value versus by-reference parameters, which the call site cannot distinguish.
- Combining default arguments with overloads that cover the same call shapes, producing an ambiguity.
- Building a large overload set where several candidates accept converted arguments, making ambiguity errors likely.
- Giving one name to functions that do genuinely different things, so the shared name misleads the reader.
- Confusing overloading with overriding, which is resolved at runtime by the object's type rather than at compile time.
- Writing long chains of isinstance checks in Python when singledispatch would keep the implementations separate.
- Relying on implicit conversion to reach an overload, when a cast at the call site would state the intent.

<!-- @doubt -->
### Why can't I overload on the return type?

<!-- @answer -->
Because the compiler chooses using only the arguments at the call site, and a call is allowed to discard its return value entirely. Writing f() with both an int and a double version gives it nothing to decide on. Even where the result is used, resolving by expected type would become ambiguous quickly, so both C++ and Java reject the declarations outright. If two functions genuinely produce different things, give them different names.

<!-- @doubt -->
### Does Python support function overloading?

<!-- @answer -->
No. A def is a statement that binds a name, so a second def with the same name rebinds it and the first function is gone — exactly like assigning a variable twice. Nothing is reported at the definition, and the failure appears later at a call that used to work. Use default arguments when only the count varies, isinstance for a couple of types, and functools.singledispatch when several types each need their own implementation.

<!-- @doubt -->
### What actually distinguishes one overload from another?

<!-- @answer -->
The parameter list: how many parameters there are, what types they have, and what order those types come in. Nothing else. The return type is not part of the signature, and neither are the parameter names — f(int a) and f(int b) are the same function. In C++, by-value versus by-reference and pointer versus array notation also fail to distinguish, which surprises people who know how differently those behave.

<!-- @doubt -->
### How does the compiler decide which overload to call?

<!-- @answer -->
It filters first, then ranks. Candidates whose parameter count cannot match are discarded immediately. Among the rest it prefers an exact type match, then a promotion such as char to int, then a standard conversion such as int to double. The single best candidate wins. If none is viable or two are equally good, it reports an error rather than guessing.

<!-- @doubt -->
### What causes an ambiguous overload error?

<!-- @answer -->
Two candidates ranking equally well for the same call. Passing a long to a set containing f(int) and f(double) is the classic case — both require a standard conversion, neither is closer, so there is no basis to choose. It is a compile error rather than a coin flip, which is the behaviour you want. Fix it by casting at the call site to force an exact match, or by adding an overload that matches exactly.

<!-- @doubt -->
### Should I use overloading or default arguments?

<!-- @answer -->
Default arguments when the versions differ only in how many parameters are supplied — it is one function and one body. Overloading when the versions differ by type and genuinely need different implementations. Avoid combining both for the same call shapes, since that is the easiest way to create an ambiguity. Java forces the choice by having no default arguments at all, which is why its libraries carry long chains of overloads doing nothing but supplying defaults.

<!-- @doubt -->
### What is the difference between overloading and overriding?

<!-- @answer -->
Overloading is several functions sharing a name with different parameters, chosen by the compiler before the program runs. Overriding is a subclass replacing an inherited method with the same parameters, chosen at runtime by the object's actual type. Same name, opposite mechanisms — one is resolved statically from the call site, the other dynamically from the object. Overriding belongs with object-oriented programming rather than here.

<!-- @doubt -->
### When should I not overload?

<!-- @answer -->
When the versions do different things. Overloading tells the reader these are the same operation on different inputs, so printing an int and printing a string is a good use, while two functions named process that behave unrelatedly for an int and a string is a bad one. If someone reading a call site cannot predict roughly what happens without checking which overload it resolves to, the shared name is costing more than it saves.
