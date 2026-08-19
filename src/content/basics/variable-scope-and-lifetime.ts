import type { SubtopicContent } from "../types";

/**
 * Subtopic 20 of Basics (Medium #4).
 *
 * Two things carry the lesson, and GFG's coverage misses both:
 *
 * 1. PYTHON HAS NO BLOCK SCOPE. A name assigned inside an if or a for survives
 *    after it. Their scope page does not mention this at all, and it is the
 *    single biggest divergence between the three languages here — it changes how
 *    you write loops, guards, and accumulators.
 *
 * 2. SCOPE AND LIFETIME ARE DIFFERENT QUESTIONS. Where a name is visible is not
 *    the same as how long the value exists. Static variables and heap allocation
 *    only make sense once those are separated.
 *
 * The UnboundLocalError asymmetry is the highest-value single gotcha: reading an
 * outer name works, but assigning anywhere in the function makes the name local
 * for the ENTIRE function, including lines above the assignment.
 */
const content: SubtopicContent = {
  id: "variable-scope-and-lifetime",
  topic: "Basics",
  title: "Variable Scope and Lifetime",
  difficulty: "Medium",
  status: "ready",

  prerequisites: [
    "variables-and-constants",
    "functions-declaration-and-calling",
    "pass-by-value-vs-pass-by-reference",
    "if-else-statements",
    "for-loop",
  ],

  summary:
    "Where a name can be seen and how long its value survives — two separate questions, and the place where Python breaks most sharply from C++ and Java.",

  theory: `
## Two questions, not one

These get conflated constantly, and separating them makes everything else clearer:

- **Scope** — *where* in the code a name is visible. A compile-time question about text.
- **Lifetime** — *how long* the value exists in memory. A runtime question about time.

They usually coincide, which is why people merge them. They don't have to. A \`static\`
variable has a tiny scope and a lifetime spanning the whole program. A heap object can
outlive every name that ever pointed at it.

## Block scope

In C++ and Java, a variable declared inside \`{ }\` exists only until the matching
closing brace:

\`\`\`
if (x > 0) {
    int temp = 5;
}
cout << temp;      // ERROR — temp no longer exists
\`\`\`

Loop counters work the same way. \`for (int i = 0; ...)\` declares \`i\` inside the loop,
and after the loop the name is gone.

This is a feature. A variable that exists only where it's needed cannot be
accidentally used elsewhere, and the compiler enforces it.

## Python has no block scope

This is the biggest divergence in the subtopic, and it changes how you write code.

**Python's smallest scope is the function.** \`if\`, \`for\`, \`while\`, and \`try\` blocks do
**not** create scopes. A name assigned inside one is visible after it:

\`\`\`
if True:
    temp = 5
print(temp)        # 5 — perfectly legal

for i in range(3):
    pass
print(i)           # 2 — the loop variable survives
\`\`\`

Two practical consequences:

**It's convenient.** You can assign inside a branch and use the value afterwards
without declaring anything first. C++ and Java require you to declare above the block.

**It's a trap.** If the branch never runs, the name was never created:

\`\`\`
if False:
    temp = 5
print(temp)        # NameError — the assignment never executed
\`\`\`

The same applies to a loop over an empty sequence — the loop variable is never
assigned, so using it afterwards raises. In C++ or Java the compiler would have caught
this; in Python it's a runtime failure on whichever input happens to skip the block.

**Habit worth forming:** initialise before the block, even though Python doesn't
require it. It costs one line and makes the failure impossible.

## Local, global, and the ladder between

A name is looked up from the inside out. Python's version is called **LEGB**:

1. **Local** — inside the current function
2. **Enclosing** — inside any function wrapping this one
3. **Global** — at module level
4. **Built-in** — \`print\`, \`len\`, and friends

C++ and Java search the same way, just with different names: block, then enclosing
blocks, then function, then class or file, then global.

The first match wins, which is what makes shadowing work.

## Shadowing

An inner name with the same spelling **hides** the outer one for the rest of that
scope:

\`\`\`
int count = 10;              // outer

void f() {
    int count = 5;           // shadows the outer one
    cout << count;           // 5
    cout << ::count;         // 10 — C++'s scope resolution operator
}
\`\`\`

No error is reported, in any of the three languages. That's the problem: shadowing is
usually accidental, and the code reads as though it's using the outer variable when it
isn't. C++ gives you \`::\` to reach past it; Java and Python have no equivalent for
locals.

Avoid reusing names across nested scopes unless you mean to.

## Reading versus assigning an outer name

This asymmetry causes one of Python's most confusing errors.

**Reading a global works with no ceremony:**

\`\`\`
count = 0
def show():
    print(count)     # 0 — reads the global fine
\`\`\`

**Assigning it does not:**

\`\`\`
count = 0
def increment():
    count = count + 1    # UnboundLocalError
\`\`\`

**Why:** Python scans the whole function before running it. Seeing an assignment to
\`count\` anywhere in the body, it decides \`count\` is **local for the entire function** —
including the line that reads it. So the read happens before the local has any value.

Note it fails on the *read*, on a line that looks perfectly fine, because of an
assignment *later*. That's what makes the error so disorienting.

**The fix** is to declare the intent:

\`\`\`
def increment():
    global count         # I mean the module-level one
    count = count + 1
\`\`\`

\`nonlocal\` does the same for a variable in an enclosing *function* rather than at
module level.

C++ and Java have no equivalent problem — assignment to an outer variable just works,
because the declaration is what creates a new variable, not the assignment.

## Lifetime

Three storage patterns, and they're worth telling apart:

**Automatic (stack).** Local variables. Created when the function is entered,
destroyed when it returns. Fast, and managed entirely for you.

**Static.** Declared once, lives for the whole program, but keeps its narrow scope. In
C++ and Java a \`static\` local retains its value **between calls**:

\`\`\`
void counter() {
    static int calls = 0;    // initialised once, ever
    calls++;
    cout << calls;
}
counter();  // 1
counter();  // 2 — it remembered
\`\`\`

Scope of one function, lifetime of the whole program. That's the clearest proof the
two ideas are separate.

**Dynamic (heap).** Objects created with \`new\` in C++ and Java, or any object in
Python. They live independently of any scope and survive as long as something refers
to them. C++ makes you free them; Java and Python collect them automatically.

This is what makes returning a reference to a local variable a bug: the *name* went out
of scope and the *stack memory* was reclaimed, so the caller holds a reference to
something that no longer exists.

## About global variables

Any function can read them and any function can change them, which means a wrong value
gives you no clue where it came from. They also make functions untestable in
isolation, since behaviour depends on hidden state.

Java doesn't have true globals at all — the nearest thing is a \`static\` field on a
class, which at least carries a name telling you where it lives.

Prefer parameters and return values. Reserve globals for genuine constants, which
cannot be changed and therefore cause none of these problems.
`.trim(),

  intuition:
    "Scope is a set of nested rooms, and a name lookup walks outward until it finds a match. Lifetime is a separate clock running on the value itself — usually it starts and stops with the room, but static and heap values keep ticking long after the room is empty.",

  approaches: [
    {
      name: "Block Scope and Function Scope",
      idea: "Know which enclosing construct a name belongs to, and when it stops existing.",
      steps: [
        "Identify the innermost construct that creates a scope in your language.",
        "In C++ and Java that is any pair of braces, including loop and conditional bodies.",
        "In Python it is the function — conditionals and loops create no scope at all.",
        "A name declared inside a scope is unusable outside it in C++ and Java.",
        "In Python the name survives, but only if the assignment actually executed.",
        "Declare above the block whenever the value is needed after it, in any language.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <iostream>
using namespace std;

int main() {
    int x = 10;

    if (x > 0) {
        int temp = 5;          // exists only inside these braces
        cout << temp << endl;  // 5
    }
    // cout << temp;           // error: 'temp' was not declared in this scope

    for (int i = 0; i < 3; i++) {
        // i lives here only
    }
    // cout << i;              // error: 'i' was not declared in this scope

    // Declare above the block when the value is needed after it
    int result = 0;
    if (x > 0) {
        result = x * 2;
    }
    cout << result << endl;    // 20

    // A bare block also creates a scope
    {
        int scratch = 99;
        cout << scratch << endl;
    }
    // scratch is gone here

    return 0;
}`,
          annotations: {
            8: "The braces are the boundary. Nothing about the if statement itself matters.",
            19: "Declaring above the block is how you carry a value out of it.",
          },
        },
        {
          language: "java",
          code: `public class Scope {
    public static void main(String[] args) {
        int x = 10;

        if (x > 0) {
            int temp = 5;
            System.out.println(temp);   // 5
        }
        // System.out.println(temp);    // error: cannot find symbol

        for (int i = 0; i < 3; i++) { }
        // System.out.println(i);       // error: cannot find symbol

        // Declare above when needed after
        int result = 0;
        if (x > 0) {
            result = x * 2;
        }
        System.out.println(result);     // 20

        // Java also rejects reading a local that may not have been assigned
        int maybe;
        if (x > 0) {
            maybe = 1;
        }
        // System.out.println(maybe);   // error: variable maybe might not
        //                              // have been initialized
    }
}`,
          annotations: {
            22: "Definite assignment analysis. Java proves a value exists on every path before allowing a read.",
          },
        },
        {
          language: "python",
          code: `x = 10

# Python has NO block scope — if and for create no scope at all
if x > 0:
    temp = 5
print(temp)        # 5 — perfectly legal, unlike C++ and Java

for i in range(3):
    pass
print(i)           # 2 — the loop variable survives the loop

# THE TRAP: if the block never runs, the name was never created
if x < 0:
    other = 5
# print(other)     # NameError: name 'other' is not defined

# Same for a loop over an empty sequence
for j in []:
    pass
# print(j)         # NameError — j was never assigned

# HABIT: initialise before the block, even though Python does not require it
result = 0
if x > 0:
    result = x * 2
print(result)      # 20

# Functions DO create scope
def f():
    local_only = 99
    print(local_only)

f()
# print(local_only)   # NameError — function scope is real`,
          annotations: {
            5: "Convenient, and the reason Python code rarely declares variables ahead of blocks.",
            13: "The cost of that convenience: the failure depends on input rather than being caught at compile time.",
            23: "One line that turns a possible runtime crash into a guaranteed sensible value.",
          },
        },
      ],
    },
    {
      name: "Reading and Writing Outer Variables",
      idea: "Reach a name defined outside the current scope — and declare your intent when you mean to change it.",
      steps: [
        "Look the name up from the innermost scope outward until a match is found.",
        "Reading an outer name requires nothing special in any of the three languages.",
        "In C++ and Java, assigning to an outer name also works, since only a declaration creates a new variable.",
        "In Python, any assignment to a name inside a function makes it local for that entire function.",
        "Declare global or nonlocal in Python when the intent is to modify the outer variable rather than create a local one.",
        "Check for accidental shadowing whenever an inner name repeats an outer one.",
      ],
      code: [
        {
          language: "python",
          code: `count = 0

# READING a global works with no ceremony
def show():
    print(count)        # 0

show()

# ASSIGNING fails — and the error lands on the READ
def broken():
    count = count + 1   # UnboundLocalError: local variable 'count'
                        # referenced before assignment

# Why: Python scans the whole function first. The assignment on this line
# makes count local for the ENTIRE function, so the read on the right-hand
# side happens before the local has any value.

# THE FIX — state the intent
def increment():
    global count
    count = count + 1

increment()
print(count)            # 1

# nonlocal reaches an enclosing FUNCTION rather than module level
def outer():
    total = 0

    def inner():
        nonlocal total  # without this, total = 5 would create a new local
        total = 5

    inner()
    print(total)        # 5

outer()

# SHADOWING — an inner name hides the outer one silently
value = 10

def shadow():
    value = 5           # a brand new local, not the global
    print(value)        # 5

shadow()
print(value)            # 10 — the global was never touched`,
          annotations: {
            11: "The line that fails looks correct. The cause is the assignment on the same line, scanned in advance.",
            20: "global says: do not create a local, use the module-level one.",
            29: "nonlocal is for enclosing functions. global would skip past outer() to module level and fail.",
          },
        },
        {
          language: "cpp",
          code: `#include <iostream>
using namespace std;

int count = 0;          // global

void show() {
    cout << count << endl;   // reading works
}

void increment() {
    count = count + 1;       // assigning works too — no keyword needed
}

int value = 10;

void shadow() {
    int value = 5;           // shadows the global
    cout << value << endl;   // 5   — the local
    cout << ::value << endl; // 10  — the global, via scope resolution
}

int main() {
    show();        // 0
    increment();
    cout << count << endl;   // 1

    shadow();
    cout << value << endl;   // 10 — untouched
    return 0;
}`,
          annotations: {
            11: "No global keyword exists because C++ has no ambiguity — only a declaration creates a variable.",
            19: "The scope resolution operator reaches past the shadow. Java and Python have no equivalent for locals.",
          },
        },
        {
          language: "java",
          code: `public class Outer {

    // Java has no true globals. The nearest equivalent is a static field.
    static int count = 0;
    static int value = 10;

    static void show() {
        System.out.println(count);      // reading works
    }

    static void increment() {
        count = count + 1;              // assigning works, no keyword needed
    }

    static void shadow() {
        int value = 5;                  // shadows the static field
        System.out.println(value);      // 5
        System.out.println(Outer.value);// 10 — qualified with the class name
    }

    public static void main(String[] args) {
        show();          // 0
        increment();
        System.out.println(count);      // 1

        shadow();
        System.out.println(value);      // 10
    }
}`,
          annotations: {
            4: "A static field belongs to the class, so its name tells you where it lives — better than a bare global.",
            18: "Qualifying with the class name is Java's way past a shadow.",
          },
        },
      ],
    },
    {
      name: "Lifetime: When a Value Exists",
      idea: "Separate how long a value survives from where its name can be seen.",
      steps: [
        "Identify where the value is stored: automatically on the stack, statically, or dynamically on the heap.",
        "An automatic local is created on entry to its scope and destroyed on exit.",
        "A static variable is initialised once and persists for the whole program, while keeping its narrow scope.",
        "A heap object lives independently of any scope, for as long as something refers to it.",
        "Never return a reference or pointer to an automatic local, since its memory is reclaimed on return.",
        "Use a static local when a function must remember something between calls, and prefer returning state otherwise.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <iostream>
#include <vector>
using namespace std;

// AUTOMATIC — created on entry, destroyed on return
void automatic() {
    int local = 0;
    local++;
    cout << local << endl;   // always 1, every call
}

// STATIC — narrow scope, program-long lifetime
void counter() {
    static int calls = 0;    // initialised once, ever
    calls++;
    cout << calls << endl;
}

// DANGER — returning a reference to an automatic local
int& broken() {
    int local = 42;
    return local;            // local is destroyed when this returns
}                            // the caller holds a dangling reference

// SAFE — return by value, or allocate on the heap
int safe() {
    int local = 42;
    return local;            // the VALUE is copied out
}

int main() {
    automatic(); automatic();   // 1, 1
    counter();   counter();     // 1, 2  <- it remembered

    // Heap: lives until nothing refers to it
    vector<int>* v = new vector<int>{1, 2, 3};
    delete v;                   // C++ makes you free it

    return 0;
}`,
          annotations: {
            14: "Scope of one function, lifetime of the whole program — the clearest proof the two are separate.",
            22: "Compiles with a warning in most compilers, and the caller reads reclaimed memory.",
            38: "Java and Python collect this automatically. C++ does not.",
          },
        },
        {
          language: "java",
          code: `public class Lifetime {

    // Java has no static LOCAL variables. A static field is the substitute.
    static int calls = 0;

    static void counter() {
        calls++;                        // persists between calls
        System.out.println(calls);
    }

    static void automatic() {
        int local = 0;                  // fresh every call
        local++;
        System.out.println(local);      // always 1
    }

    public static void main(String[] args) {
        automatic(); automatic();       // 1, 1
        counter();   counter();         // 1, 2

        // Heap objects live as long as something refers to them
        int[] arr = new int[3];
        arr = null;                     // nothing refers to it now
        // the garbage collector reclaims it at some later point
    }
}`,
          annotations: {
            3: "Unlike C++, Java cannot scope a persistent variable to a single method.",
            21: "Java cannot return a dangling reference — the object survives as long as any reference exists.",
          },
        },
        {
          language: "python",
          code: `# Python has no static locals either. A module-level variable is one option.
calls = 0

def counter():
    global calls
    calls += 1
    print(calls)

def automatic():
    local = 0        # fresh every call
    local += 1
    print(local)     # always 1

automatic(); automatic()   # 1, 1
counter();   counter()     # 1, 2

# A closure keeps state without a global, which is usually cleaner
def make_counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

c = make_counter()
print(c())   # 1
print(c())   # 2

# The enclosing function has returned, yet count still exists —
# the closure holds a reference to it, so its lifetime outlives its scope.

# Objects live as long as something refers to them
arr = [1, 2, 3]
arr = None       # nothing refers to the list now; it is collected`,
          annotations: {
            19: "A closure captures the enclosing variable rather than copying it.",
            30: "make_counter's scope ended, but count survives — scope and lifetime coming apart, visibly.",
          },
        },
      ],
    },
  ],

  examples: [
    {
      input: "A variable assigned inside an if block, then read after the block",
      output: "C++ and Java: compile error. Python: works, unless the block never ran.",
      walkthrough: [
        "In C++ and Java the braces create a scope, so the name is destroyed at the closing brace.",
        "Reading it afterwards refers to a name that no longer exists, and the compiler rejects it.",
        "In Python, an if block creates no scope at all — the smallest scope is the function.",
        "If the branch executed, the assignment created the name and it is still available afterwards.",
        "If the branch did not execute, the assignment never ran and the name was never created.",
        "Reading it then raises NameError at runtime, on whichever input happens to skip the block.",
      ],
      why: "The largest divergence in the subtopic. The same code is a build failure in two languages and an input-dependent runtime failure in the third.",
    },
    {
      input: "count = 0 at module level; def increment(): count = count + 1",
      output: "UnboundLocalError, reported on the line that reads count",
      walkthrough: [
        "Python scans the entire function body before executing any of it.",
        "It sees an assignment to count inside the function, so it marks count as local for the whole function.",
        "That decision applies to every line, including ones above or on the same line as the assignment.",
        "Execution reaches the statement and must evaluate the right-hand side first.",
        "Reading count finds the local, which has not been assigned yet, so it raises.",
        "Adding a global declaration tells Python to use the module-level variable instead, and it works.",
      ],
      why: "Disorienting because the error names a read that looks correct, and the actual cause is an assignment scanned in advance.",
    },
    {
      input: "A local variable named the same as a global, assigned inside a function",
      output: "The local is used; the global is untouched, with no warning",
      walkthrough: [
        "The name lookup starts in the innermost scope and stops at the first match.",
        "The local declaration matches first, so every use inside the function refers to it.",
        "The outer variable still exists but is unreachable by that name for the rest of the scope.",
        "Assigning inside the function modifies the local only, leaving the global exactly as it was.",
        "No error or warning is produced in any of the three languages, since this is legal.",
        "C++ can reach the global with the scope resolution operator, and Java can qualify it with the class name.",
      ],
      why: "Shadowing is almost always accidental, and the code reads as though it uses the outer variable when it does not.",
    },
    {
      input: "static int calls = 0; inside a function, incremented and printed on each call",
      output: "1, then 2, then 3 — the value survives between calls",
      walkthrough: [
        "The static declaration is executed once, the first time control reaches it, and never again.",
        "The variable is stored outside the function's stack frame, so returning does not destroy it.",
        "The first call increments it to 1 and prints that.",
        "The function returns and its frame is discarded, but the static variable is not part of that frame.",
        "The second call skips the initialisation entirely and increments the existing value to 2.",
        "The name is visible only inside the function, while the value lasts for the whole program.",
      ],
      why: "The clearest single demonstration that scope and lifetime are independent, which is the framing the whole subtopic rests on.",
    },
  ],

  visualization: {
    kind: "memory-model",
    description:
      "Draw scopes as nested rectangles — global on the outside, function inside it, and block scopes nested further in — with each declared name drawn as a chip sitting inside the rectangle that owns it. Animate a name lookup as a probe starting in the innermost rectangle and stepping outward one boundary at a time, lighting each rectangle as it searches and stopping at the first match, which is what makes shadowing visible: with two chips of the same name at different depths, the probe halts at the inner one and the outer chip is drawn greyed and unreachable. Run the block-scope contrast side by side: in the C++ and Java panel the block rectangle is solid, and when execution leaves the block its chips visibly dissolve, so a later probe passes straight through empty space and fails at compile time; in the Python panel the block rectangle is drawn as a dashed outline that owns nothing, so chips assigned inside it actually land in the enclosing function rectangle and are still there afterwards — then replay with the block skipped, where no chip is ever created and the probe finds nothing, failing at runtime instead. Add the ASSIGNMENT panel for Python's UnboundLocalError: show the function being scanned before execution, with any assigned name being stamped as local across the entire function rectangle in advance, then run the read and show the probe finding that stamped-but-empty chip rather than continuing outward to the global. Finally, a LIFETIME strip beneath everything: a horizontal timeline with a bar per variable showing when it exists, where automatic locals appear and vanish with each call, a static variable's bar starts at the first call and runs unbroken to the end of the program, and a heap object's bar persists after every name pointing at it has gone — with a dangling-reference marker where a returned reference outlives the bar it points into.",
    sampleInput:
      '{"scopes":[{"level":"global","names":["count","value"]},{"level":"function","names":["value","local"]},{"level":"block","names":["temp"],"ownedBy":{"cpp":"block","java":"block","python":"function"}}],"lookup":{"name":"value","startsAt":"function","matchesAt":"function","shadowed":"global"},"blockContrast":{"cpp":"compile error after block","java":"compile error after block","python":{"blockRan":"works","blockSkipped":"NameError"}},"unboundLocal":{"scanPhase":"count marked local for whole function","runPhase":"read finds empty local","fix":"global count"},"lifetime":[{"name":"local","kind":"automatic","spans":["call1","call2"],"resets":true},{"name":"calls","kind":"static","startsAt":"call1","endsAt":"program end","resets":false},{"name":"heapObject","kind":"dynamic","outlivesNames":true}]}',
    highlights: [
      "Scopes are drawn as nested rectangles, with each declared name sitting as a chip inside the rectangle that owns it.",
      "A lookup probe starts in the innermost rectangle and steps outward, lighting each one as it searches.",
      "With the same name at two depths, the probe halts at the inner chip and the outer one is greyed as unreachable.",
      "In the C++ and Java panel the block rectangle is solid, and its chips dissolve the moment execution leaves it.",
      "A later probe passes through that empty space and fails, which the compiler reports before the program ever runs.",
      "In the Python panel the block rectangle is dashed and owns nothing, so chips assigned inside land in the function rectangle instead.",
      "Those chips are still present after the block ends, which is why the same code compiles and runs there.",
      "Replayed with the block skipped, no chip is ever created and the probe finds nothing — a runtime failure instead of a build one.",
      "The assignment panel scans the Python function before executing it, stamping any assigned name as local across the whole rectangle.",
      "Running the read then finds that stamped but empty chip, and the probe never continues outward to the global.",
      "The lifetime strip runs a bar per variable: automatic locals appear and vanish with each call.",
      "The static variable's bar starts at the first call and runs unbroken to the end of the program, despite its narrow rectangle.",
      "A heap object's bar continues after every name pointing at it has gone, with a dangling marker where a returned reference outlives its bar.",
    ],
  },

  edgeCases: [
    "A Python name assigned only inside a branch that does not execute, which raises NameError when read afterwards.",
    "A Python loop variable used after a loop over an empty sequence, which was never assigned at all.",
    "Reading a Java local that is assigned on only some paths, which the compiler rejects as possibly uninitialised.",
    "An uninitialised C++ local, which holds leftover memory rather than a defined value.",
    "A static local initialised with a computed value, where the initialisation runs only on the first call.",
    "A returned reference or pointer to an automatic local, whose memory is reclaimed before the caller uses it.",
    "A closure capturing an enclosing variable, which keeps that variable alive after the enclosing function has returned.",
    "A loop that declares a variable inside its body, which is created and destroyed on every iteration.",
    "A name shadowing a built-in, such as naming a variable list or sum in Python, which hides the built-in for that scope.",
    "A global modified by one function and read by another, where a wrong value gives no indication of which function set it.",
  ],

  pitfalls: [
    "Assuming Python has block scope, and being surprised either that a name survives a block or that it was never created.",
    "Using a Python variable after a conditional or loop that may not have executed.",
    "Assigning to a global inside a Python function without declaring global, which raises UnboundLocalError on the read.",
    "Using global when nonlocal was meant, which skips past the enclosing function to module level.",
    "Shadowing an outer variable accidentally, so code that appears to modify it modifies a local instead.",
    "Naming a Python variable after a built-in such as list, sum or id, which hides it for the rest of the scope.",
    "Returning a reference or pointer to a local variable in C++, leaving the caller with a dangling reference.",
    "Reaching for a global to share state between functions, when a parameter and a return value would be clearer and testable.",
    "Expecting a static local to reset between calls, when it is initialised exactly once for the whole program.",
    "Declaring a variable far above where it is used, widening its scope and its opportunity to be misused.",
  ],

  commonDoubts: [
    {
      question: "Does Python have block scope?",
      answer:
        "No. Its smallest scope is the function, so if, for, while and try blocks create no scope at all. A name assigned inside one is visible after it, which C++ and Java both forbid. The convenience has a cost: if the block never executes, the assignment never runs and the name does not exist, so reading it raises NameError at runtime on whichever input skips that path. Initialising before the block is a one-line habit that removes the risk entirely.",
    },
    {
      question: "Why do I get UnboundLocalError when reading a global I clearly defined?",
      answer:
        "Because somewhere in that same function you also assign to it. Python scans the whole function before running it, and any assignment to a name makes that name local for the entire function — including lines above the assignment. So the read finds a local that has no value yet rather than the global. Add global name at the top of the function to say you mean the module-level one. Reading alone never needs this; only assigning does.",
    },
    {
      question: "What is the difference between scope and lifetime?",
      answer:
        "Scope is where a name is visible, decided by the structure of the code. Lifetime is how long the value exists in memory, decided at runtime. They usually coincide, which is why they get conflated — but a static local proves they are separate. It is visible only inside one function, and its value survives for the entire program, keeping whatever it held between calls.",
    },
    {
      question: "What is the difference between global and nonlocal in Python?",
      answer:
        "global reaches all the way out to module level. nonlocal reaches the nearest enclosing function, and is only meaningful inside a nested function. If you use global inside an inner function when you meant the outer function's variable, you skip straight past it and either modify a module-level name or fail because none exists. Choose by asking which scope actually holds the variable you want.",
    },
    {
      question: "Are global variables bad?",
      answer:
        "They are usually the wrong tool. Any function can read or change one, so a wrong value gives you no indication of which function set it, and functions that depend on hidden state cannot be tested in isolation. Java avoids true globals entirely — the nearest thing is a static field, which at least carries a class name saying where it lives. Prefer parameters and return values. Genuine constants are the exception, since nothing can change them.",
    },
    {
      question: "What does static do to a local variable?",
      answer:
        "It changes the lifetime without changing the scope. The variable is initialised once, the first time control reaches it, and stored outside the function's stack frame, so returning does not destroy it. The next call skips the initialisation and finds the value from last time. It is still visible only inside that function. Java has no static locals — a static field on the class is the substitute — and Python uses a module-level variable or, more cleanly, a closure.",
    },
    {
      question: "Why is returning a reference to a local variable a bug?",
      answer:
        "Because the value dies before the caller can use it. A local lives on the stack frame, which is reclaimed the moment the function returns, so the reference points at memory that has been handed back. In C++ this compiles, often with only a warning, and reads whatever now occupies that memory. Java and Python cannot produce this bug — their objects live on the heap and survive as long as any reference exists.",
    },
    {
      question: "What happens if I name a variable the same as something outside?",
      answer:
        "The inner name hides the outer one for the rest of that scope, and nothing warns you. Every use inside refers to the inner one, so code that looks like it modifies the outer variable quietly modifies a local instead. C++ offers the scope resolution operator to reach past it and Java lets you qualify with the class name, but neither helps with a shadowed local. Also watch for shadowing built-ins in Python — naming something list or sum hides the function for that whole scope.",
    },
  ],

  relatedIds: [
    "variables-and-constants",
    "functions-declaration-and-calling",
    "pass-by-value-vs-pass-by-reference",
    "stack-memory-and-recursion-depth",
  ],
};

export default content;
