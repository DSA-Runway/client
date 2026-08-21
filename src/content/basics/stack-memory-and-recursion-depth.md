---
id: stack-memory-and-recursion-depth
topic: Basics
title: Stack Memory and Recursion Depth
difficulty: Hard
status: ready
prerequisites:
  - functions-declaration-and-calling
  - variable-scope-and-lifetime
  - time-and-space-complexity-basics
  - count-digits
  - pass-by-value-vs-pass-by-reference
relatedIds:
  - time-and-space-complexity-basics
  - functions-declaration-and-calling
  - variable-scope-and-lifetime
  - count-digits
  - gcd-euclidean-algorithm
---

<!-- @summary -->
Where function calls physically live in memory, why recursion depth is bounded, and why the same recursion can survive 160,000 levels or die at 7,000 depending on what each frame holds.

<!-- @theory -->
## The bookmark, made physical

The Functions subtopic described a call as leaving a bookmark and coming back to it.
That bookmark is a real object in memory called a **stack frame**, and this subtopic
is about where it lives and how many of them fit.

When a function is called, the program pushes a frame containing:

- **The return address** — exactly where to resume in the caller
- **The parameters** — the arguments, copied in
- **The local variables** — everything the function declares
- **Bookkeeping** — saved registers and similar

When the function returns, the frame is **popped** and that memory is immediately
reusable. Last in, first out — which is why it is called a stack.

This is the mechanism behind the Variable Scope subtopic's claim that locals are
destroyed on return. They are not cleaned up individually; the whole frame is
discarded at once.

## Stack and heap

Two regions with different rules:

| | Stack | Heap |
|---|---|---|
| Managed by | The program automatically | You, or a collector |
| Speed | Very fast — move a pointer | Slower — find a free block |
| Lifetime | Tied to the function call | Until freed or collected |
| **Size** | **Fixed and small** | Large, grows as needed |

That last row is the whole subject. **The stack has a hard limit set before your
program starts.** Measured on this machine with `ulimit -s`: **8,176 KB, about 8 MB.**
Typical values are 1 MB on Windows and 8 MB on Linux and macOS.

8 MB sounds generous until you divide it by the size of a frame.

## Frame size decides your depth

This is the result worth carrying away, and it was measured rather than reasoned.

Two recursions were run to destruction on this machine, differing only in what each
frame held:

| Frame contents | Depth reached before crashing |
|---|---|
| A few bytes of locals (~48 bytes) | **past 160,000** |
| A 1 KB local array | **between 7,000 and 8,000** |

The second figure is exactly 8 MB ÷ 1 KB, which confirms the relationship:

```
maximum depth  ≈  stack size / frame size
```

**Adding one local array made the same recursion die 20 times sooner.** Nothing about
the algorithm changed — only what each frame carried.

The practical consequence: **do not declare large arrays as locals in a recursive
function.** Allocate them once outside, or on the heap, and pass a reference. A
buffer that looks harmless in an iterative function is a depth limit in a recursive
one.

## What happens when it runs out

All three languages hit the same wall and report it very differently.

**Python raises `RecursionError`** — a normal, catchable exception. It does not even
reach the real stack limit: the interpreter enforces its own counter first, which is
**1,000 by default**, verified with `sys.getrecursionlimit()`.

Measured: `f(998)` succeeds, `f(5000)` raises. Raising the ceiling with
`sys.setrecursionlimit(30000)` then lets `f(20000)` run — also verified.

That soft limit is a guard rail, not the true capacity. Raise it far enough and you
stop hitting Python's counter and start hitting the real stack, at which point you get
a genuine crash instead of an exception.

**Java throws `StackOverflowError`** — technically catchable, though catching it is
almost always wrong, since the stack is in an unknown state. The stack size is set
with the `-Xss` flag.

**C++ gives you nothing.** No exception, no error, no message — the program simply
receives a segmentation fault and dies. Measured here: the process was killed with no
diagnostic of any kind.

So the diagnosability runs Python, then Java, then C++ — and the danger runs the other
way.

## Depth is what matters, not the number of calls

A function called a million times **in a loop** is fine — each call returns before the
next begins, so only one frame exists at a time.

A function that recurses a million levels **deep** is fatal, because a million frames
must coexist.

```
for (int i = 0; i < 1000000; i++) f(i);   // 1 frame at a time — fine
recurse(1000000);                          // 1,000,000 frames at once — crash
```

**The stack cost is the maximum depth, not the total call count.** This is why the
recursion in Count Digits is harmless — its depth is the *digit count*, at most 19 —
while a recursion whose depth is the *input value* is not.

That distinction is the whole safety question: **does the depth scale with n, or with
something bounded?**

## Missing base case

The most common cause of stack overflow is not deep recursion but **no termination**:

```
int f(int n) { return f(n - 1); }     // never stops
```

Every recursion needs a base case that is actually reachable. Two ways it fails: no
base case at all, or one the arguments never satisfy — such as recursing on `n - 2`
from an odd starting value toward a base case of exactly zero.

A stack overflow arriving within milliseconds almost always means non-termination
rather than genuinely deep recursion.

## Tail recursion

A call is in **tail position** when it is the last thing the function does, with no
pending work afterwards:

```
int gcd(int a, int b) {
    if (b == 0) return a;
    return gcd(b, a % b);        // tail position — nothing follows
}

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1); // NOT tail position — the multiply is still pending
}
```

When nothing follows the call, the current frame is no longer needed and the compiler
can **reuse it** rather than pushing a new one, turning the recursion into a loop and
the space from O(depth) to O(1).

**Availability is the catch.** C++ compilers commonly do this at `-O2`, and the standard
does not require it. **Java and Python do not do it at all** — Python's designers
declined deliberately, on the grounds that it destroys the stack traces that make
debugging possible.

So writing a tail-recursive function is a good habit and not a guarantee. If depth
matters and you are in Java or Python, convert to a loop yourself.

## Converting recursion to iteration

Every recursion can become iteration. Two cases:

**Tail recursion** converts to a plain loop, since the parameters carry all the state.
The recursive GCD becomes the iterative GCD directly, and that is exactly why the GCD
subtopic recommended the loop.

**Non-tail recursion** needs an **explicit stack** — you store what the call stack
would have held in a data structure of your own. More code, and the depth is now
limited by heap memory rather than by the fixed stack, which is a very different
ceiling.

Worth doing when the recursion is elegant but the depth is unbounded — tree traversals
on skewed trees, graph searches on long paths.

## When recursion is fine

Do not read this as an argument against recursion. It is an argument for knowing the
depth.

**Safe**: depth bounded by a small constant, or logarithmic in the input. Count Digits
at 19, GCD at 44, a balanced binary tree at about 20 levels for a million nodes.

**Risky**: depth proportional to n. A linked list of a million nodes, a degenerate
tree, a path-following graph search.

The question is never "is recursion allowed" — it is **"how deep can this go on the
worst input the problem permits?"** Answer that from the constraints, exactly as the
complexity subtopic did for time.

<!-- @intuition -->
Every pending call is a physical object occupying a fixed shelf, and the shelf does not grow. So the limit is not how many calls you make but how many are open at once — and how fat each one is, because a recursion carrying a kilobyte of locals fits twenty times fewer levels than one carrying almost nothing.

<!-- @approach -->
### How the Call Stack Works

<!-- @idea -->
Follow a frame from push to pop, and see what it holds while it exists.

<!-- @steps -->
1. A call pushes a frame holding the return address, the parameters and the local variables.
2. The parameters are initialised from the arguments as part of building the frame.
3. The function body runs, using only its own frame's locals.
4. A nested call pushes another frame above it, leaving the caller's frame intact underneath.
5. Returning pops the frame, discarding every local in it at once and restoring the caller's position.
6. Only the frames on the current call chain exist simultaneously, which is the depth.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

int inner(int x) {
    int local = x * 2;         // lives in inner's frame
    return local;
}

int outer(int y) {
    int temp = y + 1;          // lives in outer's frame
    return inner(temp);        // pushes inner's frame ON TOP of outer's
}

int main() {
    cout << outer(5) << endl;  // 12

    // Frame timeline:
    //   [main]                     1 frame
    //   [main][outer]              2 frames — outer's temp = 6
    //   [main][outer][inner]       3 frames — inner's local = 12
    //   [main][outer]              inner returned, its frame popped
    //   [main]                     outer returned
    //
    // Maximum depth: 3. That is the stack cost, not the call count.

    // A million calls, but never more than 2 frames at once:
    for (int i = 0; i < 1000000; i++) outer(i);   // completely safe
    return 0;
}
```

<!-- @annotations -->
- 5: local exists only while inner's frame does. Returning a pointer to it would dangle, as Variable Scope covered.
- 11: outer's frame stays intact underneath — it is waiting, not gone.
- 24: The distinction that matters: total calls are irrelevant, simultaneous frames are everything.

<!-- @code java -->
```java
public class Frames {

    static int inner(int x) {
        int local = x * 2;
        return local;
    }

    static int outer(int y) {
        int temp = y + 1;
        return inner(temp);
    }

    public static void main(String[] args) {
        System.out.println(outer(5));   // 12

        // A million calls in a loop — only ever 2 frames deep
        for (int i = 0; i < 1000000; i++) outer(i);
    }
}

// Java exposes the stack directly. Inside any method:
//   Thread.currentThread().getStackTrace().length
// gives the current depth, which is a useful way to see the frames
// accumulate during a recursion.
```

<!-- @annotations -->
- 21: A genuinely handy debugging trick — print it inside a recursive call to watch the depth grow.

<!-- @code python -->
```python
import inspect

def inner(x):
    local = x * 2
    print("depth inside inner:", len(inspect.stack()))
    return local

def outer(y):
    temp = y + 1
    print("depth inside outer:", len(inspect.stack()))
    return inner(temp)

print(outer(5))
# depth inside outer: 2
# depth inside inner: 3
# 12

# A million calls, never more than 3 frames at once
for i in range(1000000):
    pass   # (calling outer a million times would just be slow, not unsafe)

# Python makes the stack inspectable at runtime, which C++ does not.
# inspect.stack() is expensive — use it to understand, not in real code.
```

<!-- @annotations -->
- 6: Python can report its own call depth directly, which makes frames concrete rather than theoretical.
- 23: Building the full stack listing on every call is far slower than the work being measured.

<!-- @approach -->
### When Recursion Runs Out of Stack

<!-- @idea -->
Find the depth limit, understand what sets it, and recognise how each language reports hitting it.

<!-- @steps -->
1. Determine the stack size available to the program, which is fixed before it starts.
2. Estimate the size of one frame from the parameters and local variables it holds.
3. Divide the stack size by the frame size to approximate the maximum depth.
4. Compare that against the deepest recursion the problem's constraints permit.
5. Reduce the frame size by moving large locals out of the recursive function if the margin is thin.
6. Recognise the failure mode: a catchable exception in Python and Java, and a silent crash in C++.

<!-- @code cpp -->
```cpp
// MEASURED ON THIS MACHINE: ulimit -s reports 8176 KB, about 8 MB.

// SMALL FRAMES — survived past depth 160,000
void thin(int depth) {
    thin(depth + 1);                    // ~48 bytes per frame
}

// FAT FRAMES — crashed between depth 7,000 and 8,000
void fat(int depth) {
    volatile char buffer[1024];         // 1 KB of locals PER FRAME
    (void) buffer;
    fat(depth + 1);
}

// 8 MB / 1 KB = 8,000 frames. The measurement matches exactly.
// The SAME recursion died 20 times sooner because of one local array.

// THE FIX — allocate once outside, pass a reference
void fixed(int depth, char* sharedBuffer) {
    // frame holds only the parameters now
    fixed(depth + 1, sharedBuffer);
}

// FAILURE MODE: C++ gives no diagnostic at all. No exception, no message —
// the process receives a segmentation fault and dies. Measured: killed
// silently, with no indication of the cause.

// Rough depth estimate before writing:
//   8 MB stack / frame size = maximum depth
//   a frame with a few ints  -> roughly 100,000+ levels
//   a frame with a 1 KB array -> roughly 8,000 levels
```

<!-- @annotations -->
- 8: This single line is the difference between 160,000 levels and 7,000.
- 19: Passing a pointer keeps the frame small — the buffer lives once, not once per level.
- 24: The worst reporting of the three languages, which makes estimating the depth in advance more important here.

<!-- @code java -->
```java
// Java throws StackOverflowError — technically catchable, and catching
// it is almost always wrong, since the stack is in an unknown state.

static int depth = 0;

static void recurse() {
    depth++;
    recurse();
}

public static void main(String[] args) {
    try {
        recurse();
    } catch (StackOverflowError e) {
        System.out.println("overflowed at depth " + depth);
    }
}

// Typical output is in the tens of thousands, depending on frame size
// and the -Xss setting.

// Stack size is configurable at launch:
//   java -Xss16m MyProgram      (16 MB instead of the default)
//
// Raising it is a last resort. If the depth scales with n, a larger
// stack only moves the failure to a larger input.
```

<!-- @annotations -->
- 14: Catching it at the top level to report the depth is a legitimate diagnostic use. Catching it to continue is not.
- 25: The important caveat — a bigger stack postpones the problem rather than solving it.

<!-- @code python -->
```python
import sys

# MEASURED: Python's default recursion limit is 1000 on this machine.
print(sys.getrecursionlimit())   # 1000

def f(n):
    return 1 if n == 0 else 1 + f(n - 1)

print(f(998))    # works — just under the limit

try:
    f(5000)
except RecursionError:
    print("RecursionError — a clean exception, not a crash")

# The limit is a soft guard rail and can be raised:
sys.setrecursionlimit(30000)
print(f(20000))  # now works — verified

# CAUTION: the interpreter's counter is NOT the real stack limit.
# Raise it far enough and you stop hitting Python's guard and start
# hitting the operating system's stack — at which point you get a
# genuine crash instead of a catchable exception.

# Note: some references state Python's limit is around 10,000.
# Measured here with Python 3 it is 1,000, and the difference matters
# when estimating whether a recursion will fit.
```

<!-- @annotations -->
- 4: Verified directly rather than quoted. A recursion deeper than about a thousand needs the limit raised or a rewrite.
- 17: Also verified: raising the ceiling to 30,000 lets a 20,000-deep recursion complete.
- 21: Raising the limit without bound converts a helpful exception into an unhelpful segfault.

<!-- @approach -->
### Converting Recursion to Iteration

<!-- @idea -->
Remove the stack cost by carrying the state yourself, either in loop variables or in an explicit stack.

<!-- @steps -->
1. Determine whether the recursive call is in tail position, meaning nothing happens after it returns.
2. If it is, the parameters carry all the state, so rewrite the call as reassigning those parameters inside a loop.
3. If it is not, identify what must be remembered across the call and push it onto a stack you manage.
4. Replace the recursion with a loop that pops from that stack until it is empty.
5. Note that the depth is now bounded by heap memory rather than by the fixed call stack.
6. Prefer the iterative form when the depth scales with the input rather than with something bounded.

<!-- @code cpp -->
```cpp
// TAIL RECURSIVE — the call is the last thing the function does
int gcdRec(int a, int b) {
    if (b == 0) return a;
    return gcdRec(b, a % b);           // nothing pending after this
}

// Converts directly to a loop: the parameters become loop variables
int gcdIter(int a, int b) {
    while (b != 0) {
        int t = a % b;
        a = b;
        b = t;
    }
    return a;
}
// O(1) space instead of O(log n). This is exactly why the GCD subtopic
// recommended the loop.

// NOT TAIL RECURSIVE — a multiplication is still pending after the call
int factRec(int n) {
    if (n <= 1) return 1;
    return n * factRec(n - 1);         // the multiply waits for the result
}

// Still convertible, because the pending work is just an accumulator
int factIter(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) result *= i;
    return result;
}

// GENUINELY NON-TAIL — an explicit stack is needed
#include <stack>
void traverseIter(TreeNode* root) {
    stack<TreeNode*> st;
    if (root) st.push(root);
    while (!st.empty()) {
        TreeNode* node = st.top(); st.pop();
        visit(node);
        if (node->right) st.push(node->right);   // you manage what the
        if (node->left)  st.push(node->left);    // call stack would have
    }
}
// The depth is now limited by heap memory rather than the 8 MB stack —
// a far higher ceiling, at the cost of writing the bookkeeping yourself.
```

<!-- @annotations -->
- 4: Tail position: the return value of the call becomes the return value of this function unchanged.
- 21: The multiply cannot happen until the call returns, so this frame must survive — that is what non-tail means.
- 38: Pushing right before left makes the left subtree pop first, matching the recursive order.

<!-- @code java -->
```java
// Java performs NO tail-call optimisation, so writing tail-recursive
// code buys nothing here. Convert manually when depth matters.

static int gcdRec(int a, int b) {
    if (b == 0) return a;
    return gcdRec(b, a % b);        // still uses O(log n) frames in Java
}

static int gcdIter(int a, int b) {
    while (b != 0) {
        int t = a % b;
        a = b;
        b = t;
    }
    return a;                       // O(1) frames
}

// Explicit stack for genuinely non-tail recursion
static void traverseIter(TreeNode root) {
    java.util.Deque<TreeNode> stack = new java.util.ArrayDeque<>();
    if (root != null) stack.push(root);
    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        visit(node);
        if (node.right != null) stack.push(node.right);
        if (node.left != null) stack.push(node.left);
    }
}

// The heap can hold far more than the stack, so this survives depths
// that would throw StackOverflowError.
```

<!-- @annotations -->
- 2: Worth knowing as a fixed Java fact — the JVM specification does not provide for it.
- 20: ArrayDeque rather than the legacy Stack class, which is synchronised and slower.

<!-- @code python -->
```python
import sys

# Python also performs NO tail-call optimisation — a deliberate design
# decision, on the grounds that it destroys the stack traces that make
# debugging possible.

def gcd_rec(a, b):
    return a if b == 0 else gcd_rec(b, a % b)   # uses real frames

def gcd_iter(a, b):
    while b:
        a, b = b, a % b
    return a                                     # O(1) frames

# Explicit stack for non-tail recursion
def traverse_iter(root):
    stack = [root] if root else []
    while stack:
        node = stack.pop()
        visit(node)
        if node.right: stack.append(node.right)
        if node.left:  stack.append(node.left)

# Python's list works directly as a stack — append and pop are both
# amortised O(1), and the depth is bounded by memory rather than by
# sys.getrecursionlimit().

# WHEN TO CONVERT — ask whether the depth scales with n:
#   Count Digits: depth is the digit count, at most 19        -> recursion fine
#   GCD:          depth is about 44 for values under 2e9      -> recursion fine
#   Balanced tree of 1,000,000 nodes: about 20 levels         -> recursion fine
#   Linked list of 1,000,000 nodes: 1,000,000 levels          -> CONVERT
#   Degenerate tree (every node has one child): n levels      -> CONVERT
```

<!-- @annotations -->
- 4: The reason is worth knowing: it is a trade of performance for debuggability, not an oversight.
- 22: The practical checklist. The question is never whether recursion is allowed, but how deep it can go.

<!-- @example -->

<!-- @input -->
The same recursion with a few bytes of locals, and with a 1 KB local array

<!-- @output -->
Past depth 160,000 versus between 7,000 and 8,000

<!-- @why -->
The non-obvious result of the subtopic. Frame size is invisible in the code and decides whether a recursion survives, which is why large locals do not belong in recursive functions.

<!-- @walkthrough -->
1. The stack on this machine is 8,176 KB, roughly 8 MB, reported by ulimit -s.
2. The first version declares almost nothing, giving a frame of around 48 bytes.
3. Dividing 8 MB by 48 bytes predicts a depth in the low hundreds of thousands, and the measurement passed 160,000.
4. The second version declares a 1 KB array as a local, so every frame carries an extra kilobyte.
5. Dividing 8 MB by 1 KB predicts about 8,000 frames, and the measurement crashed between 7,000 and 8,000.
6. Nothing about the algorithm changed — only what each frame holds — and the safe depth fell by a factor of twenty.

<!-- @example -->

<!-- @input -->
A function called one million times in a loop, versus recursing one million levels deep

<!-- @output -->
The loop is completely safe. The recursion crashes.

<!-- @why -->
The distinction that determines whether recursion is safe. It reframes the question from how often a function is called to how many calls are open at once.

<!-- @walkthrough -->
1. In the loop, each call pushes a frame, runs, and pops before the next call begins.
2. At any instant only one frame exists beyond the caller's, so the stack never grows.
3. A million calls therefore cost no more stack than a single call does.
4. In the recursion, each call makes another before returning, so no frame is popped until the base case is reached.
5. A million frames must coexist, which at even a hundred bytes each is a hundred megabytes against an eight megabyte limit.
6. The stack cost is the maximum depth, never the total number of calls.

<!-- @example -->

<!-- @input -->
Exceeding the recursion limit in Python, Java, and C++

<!-- @output -->
Python: catchable RecursionError. Java: StackOverflowError. C++: silent segmentation fault.

<!-- @why -->
Knowing how the failure will present decides how much you must reason about depth in advance. In C++ there is no runtime signal to fall back on.

<!-- @walkthrough -->
1. Python enforces its own counter before the real stack is touched, defaulting to 1,000 on this machine.
2. Measured: a recursion of depth 998 succeeds and one of depth 5,000 raises RecursionError, which is an ordinary catchable exception.
3. Raising the ceiling with setrecursionlimit to 30,000 then allowed a 20,000-deep recursion to complete, also verified.
4. Java throws StackOverflowError when the real stack is exhausted, which can be caught to report the depth though catching it to continue is unwise.
5. C++ provides nothing: the process receives a segmentation fault and dies with no exception, message or indication of cause.
6. So diagnosability decreases from Python to Java to C++, while the underlying limit is the same physical constraint.

<!-- @example -->

<!-- @input -->
A recursion with no reachable base case

<!-- @output -->
Stack overflow within milliseconds

<!-- @why -->
The timing is a useful diagnostic. An immediate overflow points at a broken base case, while one that takes a moment points at a depth problem.

<!-- @walkthrough -->
1. Each call immediately makes another without any condition stopping it.
2. No frame is ever popped, so the stack grows without bound.
3. At a few dozen bytes per frame, eight megabytes is consumed in a fraction of a second.
4. The failure is therefore almost instant rather than gradual.
5. The same happens with a base case that exists but is never reached, such as decrementing by two toward zero from an odd number.
6. A stack overflow that appears immediately almost always means non-termination rather than genuinely deep recursion.

<!-- @visualization memory-model -->

<!-- @description -->
Draw memory as a tall vertical region with a fixed capacity marker near the top labelled with the measured 8 MB, and the heap as a separate unbounded region beside it. Frames stack upward from the bottom: each call animates a rectangle sliding in above the previous one, labelled with the function name and showing its return address, parameters and locals as compartments inside it. Returning animates the top rectangle sliding out and vanishing, with its locals disappearing at once rather than one by one — that is the visual claim that scope ends by frame disposal. Run the loop case first: a million calls where each rectangle appears and immediately vanishes, so the tower never rises above two, with a counter showing the call count climbing while the height stays flat. Then run the recursive case on the same count and let the tower rise steadily toward the capacity marker. The critical panel is FRAME SIZE: run two recursions side by side against identical capacity bars, one with thin rectangles and one where each rectangle is drawn twenty times taller because of a 1 KB local array. Both climb at the same rate in frames per second, and the fat tower reaches the ceiling while the thin one is still barely off the floor — with the measured depths, past 160,000 and between 7,000 and 8,000, marked where each crosses. Then animate the fix: the 1 KB block is lifted out of every frame and placed once in the heap region, with each frame keeping only a thin pointer compartment, and the tower visibly slims back down. Finish with the FAILURE panel showing the same overflow in three languages: Python's tower stops at a soft line drawn at 1,000 with a catchable exception label well below the real ceiling, Java's reaches the real ceiling and throws, and C++'s crosses it with no marker at all and the whole diagram simply goes dark.

<!-- @sampleInput -->
```json
{"stackSize":{"measured":"8176 KB","approx":"8 MB","source":"ulimit -s"},"frameSizeExperiment":[{"locals":"~48 bytes","depthReached":">160000"},{"locals":"1 KB array","depthReached":"7000-8000","predicted":"8 MB / 1 KB = 8000"}],"loopVsRecursion":{"calls":1000000,"loopMaxFrames":2,"recursionMaxFrames":1000000,"loopSafe":true,"recursionSafe":false},"failureModes":{"python":{"softLimit":1000,"error":"RecursionError","catchable":true,"verified":["f(998) ok","f(5000) raises","setrecursionlimit(30000) then f(20000) ok"]},"java":{"error":"StackOverflowError","catchable":true,"flag":"-Xss"},"cpp":{"error":"segmentation fault","catchable":false,"diagnostic":"none"}},"safeDepths":[{"case":"count-digits","depth":19},{"case":"gcd","depth":44},{"case":"balanced tree, 1e6 nodes","depth":20},{"case":"linked list, 1e6 nodes","depth":1000000,"safe":false}]}
```

<!-- @highlights -->
- Memory is drawn as a tall region with a fixed capacity marker at the measured 8 MB, beside an unbounded heap.
- Each call slides a labelled rectangle in above the previous one, with compartments for return address, parameters and locals.
- Returning slides the top rectangle out and its locals vanish all at once, rather than individually.
- In the loop case a million rectangles appear and vanish while the tower never rises above two.
- The call counter climbs into the millions while the tower height stays flat.
- In the recursive case the same call count builds a tower that rises steadily toward the ceiling.
- The frame-size panel runs two recursions against identical capacity bars, one with rectangles twenty times taller.
- Both climb at the same rate in frames per second, and the fat tower hits the ceiling while the thin one is barely off the floor.
- The measured depths are marked where each crosses: past 160,000 and between 7,000 and 8,000.
- The fix lifts the 1 KB block out of every frame into the heap, leaving each frame a thin pointer compartment.
- The tower visibly slims and its ceiling moves far higher without any change to the algorithm.
- Python's tower stops at a soft line drawn at 1,000, well below the real ceiling, labelled as a catchable exception.
- Java's tower reaches the real ceiling and throws, with the error named at the crossing point.
- C++'s tower crosses the ceiling with no marker at all and the whole diagram goes dark.

<!-- @edgeCases -->
- A recursion with no base case, which exhausts the stack within milliseconds rather than gradually.
- A base case that exists but is unreachable, such as decrementing by two toward zero from an odd starting value.
- A recursive function declaring a large local array, where the frame size rather than the algorithm sets the depth limit.
- A function called many times in a loop, where the total call count is irrelevant because frames do not accumulate.
- Mutual recursion between two functions, where the combined depth is what matters rather than either function alone.
- A balanced tree of a million nodes, whose recursion depth is only about twenty levels.
- A degenerate tree where every node has one child, whose depth equals the node count and behaves like a linked list.
- Python's recursion limit raised beyond the real stack capacity, converting a catchable exception into a genuine crash.
- A tail-recursive function compiled without optimisation, where the frames the optimiser would have eliminated are all present.
- A stack overflow inside a destructor or exception handler, where the recovery path itself needs stack that is no longer available.

<!-- @pitfalls -->
- Declaring a large array as a local inside a recursive function, which can reduce the safe depth by an order of magnitude.
- Assuming a million calls is dangerous, when only a million simultaneous frames is.
- Relying on tail-call optimisation, which C++ compilers may perform and Java and Python never do.
- Catching StackOverflowError in Java to continue execution, when the stack is in an unknown state.
- Raising Python's recursion limit without bound, which replaces a catchable exception with a segmentation fault.
- Writing recursion whose depth scales with n when the input size is large, such as traversing a long linked list.
- Expecting a diagnostic message in C++, which crashes silently with no exception or indication of the cause.
- Increasing the stack size with a launch flag instead of fixing a depth that grows with the input.
- Forgetting that mutual recursion accumulates depth across both functions.
- Assuming Python's recursion limit is around ten thousand, when it is one thousand by default.

<!-- @doubt -->
### What is actually stored in a stack frame?

<!-- @answer -->
The return address telling the program exactly where to resume in the caller, the parameters copied in from the arguments, all the local variables the function declares, and some bookkeeping such as saved registers. The frame exists from the moment the call is made until it returns, at which point the entire thing is discarded at once. That is the mechanism behind locals being destroyed on return — they are not cleaned up individually, the whole frame goes.

<!-- @doubt -->
### How deep can my recursion go?

<!-- @answer -->
Roughly the stack size divided by the frame size. Measured on this machine, the stack is about 8 MB, and a recursion with only a few bytes of locals survived past 160,000 levels while one carrying a 1 KB local array crashed between 7,000 and 8,000 — which is precisely 8 MB divided by 1 KB. So the answer depends as much on what each frame holds as on the algorithm. Python is different again: its interpreter enforces a counter of 1,000 by default, well before the real stack is touched.

<!-- @doubt -->
### Why did adding one local array make my recursion crash?

<!-- @answer -->
Because that array is allocated in every frame, not once. A 1 KB buffer in a recursion 8,000 levels deep is 8 MB of stack, which is the entire budget. Measured here, adding a single 1 KB local reduced the safe depth by a factor of twenty. Allocate large buffers once outside the recursive function and pass a pointer or reference, so each frame carries only the address rather than the data.

<!-- @doubt -->
### Is calling a function a million times dangerous?

<!-- @answer -->
Not at all, if they are sequential. In a loop each call pushes a frame, runs, and pops before the next begins, so only one frame exists at a time and a million calls cost no more stack than one. The danger is a million calls that are all open simultaneously, which is what recursion produces. The stack cost is the maximum depth, never the total call count.

<!-- @doubt -->
### What is tail recursion and can I rely on it?

<!-- @answer -->
A call is in tail position when nothing happens after it returns — the recursive result becomes the function's result unchanged. When that holds, the current frame is no longer needed and the compiler can reuse it instead of pushing a new one, making the space constant. C++ compilers commonly do this at optimisation levels like -O2, and the standard does not require it. Java and Python never do it, and Python's designers declined deliberately because it destroys the stack traces that make debugging possible. So write tail-recursive code by preference and do not depend on the optimisation.

<!-- @doubt -->
### When should I convert recursion to a loop?

<!-- @answer -->
When the depth scales with the input rather than with something bounded. Count Digits recurses at most nineteen levels and GCD about forty-four, so both are safe forever. A balanced tree of a million nodes is about twenty levels deep, also safe. A linked list of a million nodes, or a degenerate tree where every node has one child, gives a depth of a million and will overflow. The question is never whether recursion is allowed — it is how deep it can go on the worst input the constraints permit.

<!-- @doubt -->
### How do the three languages report a stack overflow?

<!-- @answer -->
Very differently. Python raises RecursionError, an ordinary catchable exception, and it does so at its own soft limit of 1,000 rather than at the real stack boundary. Java throws StackOverflowError, which is catchable — reporting the depth at the top level is a reasonable diagnostic use, and catching it to carry on is not, since the stack is in an unknown state. C++ gives nothing at all: the process receives a segmentation fault and dies with no message. That is why estimating the depth in advance matters most in C++.

<!-- @doubt -->
### Should I just increase the stack size?

<!-- @answer -->
Rarely. Java accepts -Xss and Python has setrecursionlimit, and both are legitimate when you know the depth is bounded and merely larger than the default. They are the wrong fix when the depth grows with n, because a larger stack only moves the failure to a larger input. Raising Python's limit carries an extra hazard: past a certain point you stop hitting the interpreter's guard and start hitting the operating system's stack, turning a catchable exception into a silent crash.
