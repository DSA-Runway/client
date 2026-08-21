---
id: pass-by-value-vs-pass-by-reference
topic: Basics
title: Pass by Value vs Pass by Reference
difficulty: Medium
status: ready
prerequisites:
  - functions-declaration-and-calling
  - function-parameters-and-return-values
  - variables-and-constants
  - for-each-loop
  - data-types
relatedIds:
  - function-parameters-and-return-values
  - variables-and-constants
  - for-each-loop
  - variable-scope-and-lifetime
---

<!-- @summary -->
Whether a function receives a copy of your value or the value itself — and why Java and Python let you change a list inside a function but never let you swap two numbers.

<!-- @theory -->
## The question

When you pass something to a function, does the function get **your variable** or **a
copy of it**?

```
void increment(int x) { x = x + 1; }

int n = 5;
increment(n);
print(n);      // 5 or 6?
```

The answer decides whether functions can change their caller's data. It is 5, in all
three languages — but *why* differs, and the difference matters more than the answer.

## Pass by value

**The function receives a copy.** The parameter is a separate variable initialised
from the argument. Writing to it modifies the copy; the caller's variable is untouched.

This is the default everywhere, and it is a good default — a function that cannot
silently rewrite your data is easier to reason about.

## Pass by reference

**The parameter is another name for the caller's variable.** Not a copy — an alias.
Writing to it writes to the original.

**C++ is the only one of your three languages that has this.** Add `&` to the
parameter type:

```
void increment(int& x) { x = x + 1; }   // x IS the caller's variable

int n = 5;
increment(n);
print(n);      // 6
```

## The decisive test: can you write swap?

Forget the terminology for a moment. One question settles it:

**Can you write a function that swaps two integer variables belonging to the caller?**

```
void swap(int& a, int& b) { int t = a; a = b; b = t; }   // C++: yes
```

In **Java** this is impossible. In **Python** it is impossible. Not awkward — there is
no syntax for it, no trick, no workaround. You can return a pair and have the caller
reassign, but no function can reach out and swap two of the caller's integers.

That impossibility is the proof that neither language has pass by reference.

## So why does modifying a list work?

Here is where nearly everyone goes wrong:

```
def add_item(lst):
    lst.append(99)      # the caller's list DOES change

arr = [1, 2]
add_item(arr)
print(arr)              # [1, 2, 99]
```

If it's pass by value, how did the caller's list change?

**Because a copy of a reference still points at the same object.**

For an object, the value stored in your variable is not the object — it is a
**reference to** the object, sitting elsewhere in memory. Passing by value copies that
reference. Now two references exist, and **both point at the same object**.

- **Mutating** the object — `append`, `add`, setting a field — goes *through* the
  reference and reaches the one shared object. The caller sees it.
- **Reassigning** the parameter points the *copy* somewhere new. The caller's
  reference is untouched. The caller sees nothing.

That asymmetry is the tell. True pass by reference would make **both** visible.

```
def replace(lst):
    lst = [9, 9]        # rebinds the local copy only

arr = [1, 2]
replace(arr)
print(arr)              # [1, 2] — unchanged
```

## This is the same model you already have

Three lessons now converge:

- **Variables and Constants** — a name is a *label on an object*, not a box holding it.
- **For-Each Loop** — `row.append(x)` changes the collection; `row = [...]` does not.
- **Here** — a parameter is another label on the same object.

One rule covers all three: **assignment moves the label; method calls reach through
it.** Nothing new is happening at a function boundary.

## What each language actually does

| | Primitives | Objects | True pass by reference? |
|---|---|---|---|
| **C++** | copy, or alias with `&` | copy, or alias with `&` | **Yes** |
| **Java** | copy of the value | copy of the reference | **No** |
| **Python** | copy of the reference | copy of the reference | **No** |

**Java is strictly pass by value.** Every argument is copied. For a primitive that's
the number; for an object it's the reference. There is no reference syntax anywhere in
the language.

**Python is the same**, sometimes called *call by sharing*. Python has no primitives —
everything is an object — but integers and strings are **immutable**, so there is
nothing to mutate and they behave exactly like copies.

That immutability is the whole reason `swap` fails in Python. It's not that integers
are passed differently; it's that nothing can change an integer object in place.

## C++'s three ways to pass

Since C++ is the one with real choice, know all three:

```
void f(int x);          // by value  — a copy; caller safe; costly for big objects
void f(int& x);         // by reference — an alias; can modify the caller's variable
void f(const int& x);   // by const reference — an alias you promise not to write to
```

**`const&` is the one you'll use most in real code.** Passing a large `vector` or
`string` by value copies every element on every call. `const&` avoids the copy while
guaranteeing the function cannot modify it — the performance of a reference with the
safety of a value.

Rule of thumb: small types (`int`, `char`, `bool`) by value, large types by
`const&`, and plain `&` only when you genuinely intend to modify.

C++ also has pointers, `void f(int* x)`, which pass the *address* by value — the same
mechanism Java and Python use internally, just written out explicitly.

## Getting modification without references

When the language won't give you references and you need a function to change
something:

- **Return the new value** and let the caller assign it. Usually the cleanest answer.
- **Pass a mutable container** — a list or array with one element, an object with
  fields. Mutating it works because mutation always works.
- **Return several values** and unpack, as covered in the previous subtopic.

Prefer returning. A function that quietly modifies its arguments is harder to read,
harder to test, and the source of bugs that only appear when someone reuses it.

<!-- @intuition -->
Everything is passed by value — the only question is what the value is. For a number it is the number. For an object it is a signpost pointing at the object. Copy a signpost and you still arrive at the same place, which is why you can repaint the building but cannot move the caller's signpost.

<!-- @approach -->
### Passing by Value

<!-- @idea -->
The function gets a copy, so writing to the parameter cannot affect the caller.

<!-- @steps -->
1. The argument's value is copied into the parameter when the call is made.
2. The parameter is a separate variable that exists only for the duration of the call.
3. Writing to it modifies the copy alone.
4. When the function returns, the copy is discarded.
5. The caller's variable holds exactly what it held before the call.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void increment(int x) {     // x is a copy
    x = x + 1;
    cout << "inside: " << x << endl;   // 6
}

int main() {
    int n = 5;
    increment(n);
    cout << "outside: " << n << endl;  // 5 — unchanged

    // A swap attempt by value does nothing
    auto badSwap = [](int a, int b) { int t = a; a = b; b = t; };
    int p = 1, q = 2;
    badSwap(p, q);
    cout << p << " " << q << endl;     // 1 2 — still unswapped

    return 0;
}
```

<!-- @annotations -->
- 4: x is initialised from the argument and is a separate variable from that point on.
- 15: Both parameters are copies, so the swap happens entirely inside the function and is then discarded.

<!-- @code java -->
```java
public class ByValue {

    static void increment(int x) {     // x is a copy
        x = x + 1;
        System.out.println("inside: " + x);   // 6
    }

    static void badSwap(int a, int b) {
        int t = a; a = b; b = t;       // swaps the copies only
    }

    public static void main(String[] args) {
        int n = 5;
        increment(n);
        System.out.println("outside: " + n);   // 5

        int p = 1, q = 2;
        badSwap(p, q);
        System.out.println(p + " " + q);       // 1 2

        // There is no version of badSwap that works.
        // Java has no reference parameters at all.
    }
}
```

<!-- @annotations -->
- 9: This is not a fixable bug. No signature exists in Java that would make it work.

<!-- @code python -->
```python
def increment(x):        # x is a name bound to the same integer
    x = x + 1            # rebinds x to a NEW integer object
    print("inside:", x)  # 6

n = 5
increment(n)
print("outside:", n)     # 5

def bad_swap(a, b):
    a, b = b, a          # rebinds the local names only

p, q = 1, 2
bad_swap(p, q)
print(p, q)              # 1 2

# The real reason: integers are IMMUTABLE.
# x = x + 1 cannot modify the integer 5 — it creates the integer 6
# and points the local name at it. The caller's name never moved.

# Python's actual idiom for swapping is to do it inline
p, q = q, p
print(p, q)              # 2 1
```

<!-- @annotations -->
- 2: Nothing modifies the object 5. A new object is created and the local name is repointed.
- 17: Immutability, not the passing mechanism, is why numbers cannot be changed through a parameter.

<!-- @approach -->
### Passing by Reference in C++

<!-- @idea -->
Make the parameter an alias for the caller's variable, so the function can modify it.

<!-- @steps -->
1. Add an ampersand to the parameter type to declare it as a reference.
2. No copy is made — the parameter becomes another name for the caller's variable.
3. Writing to the parameter writes directly to the caller's variable.
4. Add const when the goal is only to avoid a copy, not to allow modification.
5. Choose by value for small types, const reference for large ones, and plain reference only when modification is intended.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <vector>
#include <string>
using namespace std;

// BY REFERENCE — the parameter is the caller's variable
void increment(int& x) {
    x = x + 1;
}

// The swap that Java and Python cannot express
void swapValues(int& a, int& b) {
    int t = a;
    a = b;
    b = t;
}

// BY CONST REFERENCE — no copy, and no modification permitted
int totalLength(const vector<string>& words) {
    int total = 0;
    for (const string& w : words) total += w.size();
    // words.push_back("x");   // would not compile — const forbids it
    return total;
}

// BY POINTER — passes the address by value, the mechanism Java and Python use
void incrementPtr(int* x) {
    *x = *x + 1;               // dereference to reach the caller's variable
}

int main() {
    int n = 5;
    increment(n);
    cout << n << endl;         // 6 — genuinely modified

    int p = 1, q = 2;
    swapValues(p, q);
    cout << p << " " << q << endl;   // 2 1 — actually swapped

    vector<string> words = {"alpha", "beta"};
    cout << totalLength(words) << endl;   // 9, with no vector copied

    incrementPtr(&n);
    cout << n << endl;         // 7

    return 0;
}
```

<!-- @annotations -->
- 7: One character separates this from the by-value version, and it changes everything.
- 19: Without const&, every call would copy the entire vector and every string inside it.
- 26: The pointer itself is copied, but it holds an address, so dereferencing reaches the original.

<!-- @code java -->
```java
// Java has NO reference parameters. These are the substitutes.

// SUBSTITUTE 1 — return the new value (cleanest)
static int increment(int x) {
    return x + 1;
}

// SUBSTITUTE 2 — a mutable container, since mutation always works
static void increment(int[] box) {
    box[0] = box[0] + 1;
}

// SUBSTITUTE 3 — swap via an array, which GFG recommends explicitly
static void swapValues(int[] arr, int i, int j) {
    int t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
}

public static void main(String[] args) {
    int n = 5;
    n = increment(n);              // caller reassigns
    System.out.println(n);         // 6

    int[] box = {5};
    increment(box);                // mutation reaches the shared array
    System.out.println(box[0]);    // 6

    int[] arr = {1, 2};
    swapValues(arr, 0, 1);
    System.out.println(arr[0] + " " + arr[1]);   // 2 1
}
```

<!-- @annotations -->
- 4: Returning is almost always better than simulating references with containers.
- 10: A one-element array as a mutable box. It works, and it reads badly — use it only when returning is impossible.
- 15: Swapping array elements works because the array is one shared object; swapping two variables still does not.

<!-- @code python -->
```python
# Python has no reference parameters either. Same substitutes.

# SUBSTITUTE 1 — return the new value
def increment(x):
    return x + 1

n = 5
n = increment(n)      # caller reassigns
print(n)              # 6

# SUBSTITUTE 2 — a mutable container
def increment_box(box):
    box[0] = box[0] + 1

box = [5]
increment_box(box)
print(box[0])         # 6

# SUBSTITUTE 3 — return several values and unpack
def swap_values(a, b):
    return b, a

p, q = 1, 2
p, q = swap_values(p, q)
print(p, q)           # 2 1

# Swapping elements inside a shared list does work
def swap_in_list(arr, i, j):
    arr[i], arr[j] = arr[j], arr[i]

arr = [1, 2]
swap_in_list(arr, 0, 1)
print(arr)            # [2, 1]
```

<!-- @annotations -->
- 20: Returning a tuple and unpacking is the idiomatic Python answer to the swap problem.
- 28: The list is one shared object, so reordering its contents is visible to the caller.

<!-- @approach -->
### What Java and Python Actually Do

<!-- @idea -->
Recognise that a copied reference still points at the same object, which makes mutation visible and reassignment invisible.

<!-- @steps -->
1. Identify what value the variable actually holds — a number, or a reference to an object.
2. The call copies that value into the parameter, whichever it is.
3. If it was a reference, both the caller and the parameter now point at the same object.
4. Mutating that object through the parameter reaches the shared object, so the caller sees the change.
5. Reassigning the parameter points only the copy elsewhere, so the caller sees nothing.
6. Use that asymmetry as the test: true pass by reference would make both visible.

<!-- @code python -->
```python
# MUTATION reaches the caller — one shared object
def add_item(lst):
    lst.append(99)

arr = [1, 2]
add_item(arr)
print(arr)          # [1, 2, 99] — changed

# REASSIGNMENT does not — only the local name moves
def replace(lst):
    lst = [9, 9]

arr = [1, 2]
replace(arr)
print(arr)          # [1, 2] — unchanged

# Both in one function, to see the asymmetry directly
def both(lst):
    lst.append(3)   # visible to the caller
    lst = [9, 9]    # from here on, lst is a different object
    lst.append(4)   # affects only the new local object

arr = [1, 2]
both(arr)
print(arr)          # [1, 2, 3] — the append landed, the rest did not

# Immutable objects cannot show the mutation half at all
def change_string(s):
    s = s + "!"     # strings are immutable, so this can only rebind

text = "hi"
change_string(text)
print(text)         # hi
```

<!-- @annotations -->
- 18: The single clearest demonstration: one call, one visible change and two invisible ones.
- 27: There is no mutating operation on a string, so only rebinding is possible — hence it always looks like a copy.

<!-- @code java -->
```java
import java.util.*;

// MUTATION reaches the caller
static void addItem(List<Integer> list) {
    list.add(99);
}

// REASSIGNMENT does not
static void replace(List<Integer> list) {
    list = new ArrayList<>(List.of(9, 9));
}

// Both together
static void both(List<Integer> list) {
    list.add(3);                                 // visible
    list = new ArrayList<>(List.of(9, 9));       // now a different object
    list.add(4);                                 // affects only the new one
}

public static void main(String[] args) {
    List<Integer> arr = new ArrayList<>(List.of(1, 2));
    addItem(arr);
    System.out.println(arr);      // [1, 2, 99]

    arr = new ArrayList<>(List.of(1, 2));
    replace(arr);
    System.out.println(arr);      // [1, 2] — unchanged

    arr = new ArrayList<>(List.of(1, 2));
    both(arr);
    System.out.println(arr);      // [1, 2, 3]

    // Strings are immutable in Java too, so they always look like copies
    String s = "hi";
    changeString(s);
    System.out.println(s);        // hi
}

static void changeString(String s) {
    s = s + "!";                  // rebinds the local reference only
}
```

<!-- @annotations -->
- 10: The local reference is repointed. The caller's reference still holds the original object.
- 16: After this line the parameter and the caller's variable refer to different objects.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

// C++ makes the distinction explicit in the signature, so there is no ambiguity

void byValue(vector<int> v) {
    v.push_back(99);       // modifies a COPY of the whole vector
}

void byReference(vector<int>& v) {
    v.push_back(99);       // modifies the caller's vector
}

int main() {
    vector<int> arr = {1, 2};

    byValue(arr);
    // arr is still {1, 2} — the entire vector was copied on the way in

    byReference(arr);
    // arr is now {1, 2, 99}

    return 0;
}
```

<!-- @annotations -->
- 6: Unlike Java and Python, passing a container by value in C++ copies every element.
- 10: The caller can tell which will happen just by reading the signature — that is C++'s advantage here.

<!-- @example -->

<!-- @input -->
A function that tries to swap two integer variables belonging to the caller

<!-- @output -->
Works in C++ with reference parameters. Impossible in Java and Python.

<!-- @why -->
The decisive test. Whether a language can express this settles whether it has pass by reference, without any argument about terminology.

<!-- @walkthrough -->
1. In C++, declaring the parameters with an ampersand makes them aliases for the caller's variables.
2. The three-step swap writes directly to those variables, so the caller's values are exchanged.
3. In Java, both parameters are copies of the caller's numbers, so the swap happens inside the function and is discarded.
4. No alternative signature exists, because Java has no reference parameters anywhere in the language.
5. In Python, the parameters are names bound to the same integer objects, and integers are immutable.
6. Rebinding those names inside the function cannot affect the caller's names, so the swap is equally impossible.

<!-- @example -->

<!-- @input -->
def add_item(lst): lst.append(99)  called with arr = [1, 2]

<!-- @output -->
arr becomes [1, 2, 99] — the caller's list did change

<!-- @why -->
The observation that convinces people a language passes by reference, shown with the mechanism that actually explains it.

<!-- @walkthrough -->
1. The variable arr holds a reference to a list object, not the list itself.
2. The call copies that reference into the parameter, so two references now exist.
3. Both references point at the same single list object in memory.
4. Calling append travels along the parameter's reference and modifies that shared object.
5. There is only one list, so the caller sees the change through its own reference.
6. This is not pass by reference — it is a copied reference reaching a shared object.

<!-- @example -->

<!-- @input -->
def replace(lst): lst = [9, 9]  called with arr = [1, 2]

<!-- @output -->
arr is still [1, 2] — nothing changed

<!-- @why -->
Placed beside the previous example it isolates the asymmetry, which is the actual proof that neither language passes by reference.

<!-- @walkthrough -->
1. The call copies the reference into the parameter, exactly as before.
2. Assigning a new list to the parameter creates a new object and points the parameter at it.
3. Only the parameter's copy of the reference moved.
4. The caller's reference still points at the original list, which was never touched.
5. When the function returns, the parameter and the new list are discarded.
6. Under true pass by reference the caller's variable would have been repointed too.

<!-- @example -->

<!-- @input -->
Passing a vector of 10,000 strings to a C++ function by value versus by const reference

<!-- @output -->
By value copies every string; by const reference copies nothing

<!-- @why -->
The practical reason const reference dominates real C++ code, and the one place the value-versus-reference choice is about speed rather than semantics.

<!-- @walkthrough -->
1. By value, the parameter is a brand new vector constructed from the argument.
2. Constructing it copies all 10,000 elements, and each string copies its own characters.
3. That work happens on every call, even when the function only reads the data.
4. By const reference, the parameter is an alias and no copying occurs at all.
5. The const qualifier makes any attempt to modify it a compile error, so the caller's data is still safe.
6. The result is the performance of a reference with the safety guarantee of a value.

<!-- @visualization memory-model -->

<!-- @description -->
Split the canvas into a CALLER region and a FUNCTION region, with a shared heap area below both. For the by-value case with a number, draw the caller's variable as a box holding a value, and animate the call duplicating that value into a separate parameter box in the function region — two independent boxes, visibly unconnected. Writing in the function changes only its box, and when the function returns that box is destroyed while the caller's is untouched. For the C++ reference case, replace the duplication with a tether: the parameter is drawn as an outline with no value of its own, linked directly to the caller's box, so a write animates the value changing inside the caller's box itself. The critical panel is the OBJECT case for Java and Python. Draw the caller's variable as a box containing an arrow rather than a value, with the arrow pointing down to a list object in the heap. The call duplicates the arrow into the parameter box — two boxes, two arrows, one object — and the object below is drawn with both arrows converging on it. Now run the two operations in sequence and animate the difference: a method call travels down the parameter's arrow and visibly appends an item to the shared object, which the caller's arrow also points at, so the change is reachable from both; then a reassignment constructs a brand new object in the heap and swings only the parameter's arrow across to it, leaving the caller's arrow pointing at the original entirely unmoved. Freeze on that frame with two arrows now diverging to two different objects, since it is the whole explanation. Finish with a COST panel contrasting a C++ vector passed by value, where every element is drawn being duplicated into a second container, against the same vector passed by const reference, where a single tether appears and nothing is copied.

<!-- @sampleInput -->
```json
{"cases":[{"kind":"primitive-by-value","caller":{"name":"n","value":5},"param":{"name":"x","value":5,"linked":false},"writes":6,"callerAfter":5},{"kind":"cpp-reference","caller":{"name":"n","value":5},"param":{"name":"x","alias":true},"writes":6,"callerAfter":6},{"kind":"object-copied-reference","caller":{"name":"arr","pointsTo":"obj1"},"param":{"name":"lst","pointsTo":"obj1"},"heap":{"obj1":[1,2]},"operations":[{"op":"append","value":99,"reaches":"obj1","visibleToCaller":true},{"op":"reassign","creates":"obj2","swings":"param","visibleToCaller":false}],"final":{"obj1":[1,2,99],"obj2":[9,9],"callerSees":[1,2,99]}}],"cost":{"container":"vector<string>","elements":10000,"byValue":"10000 copies","byConstRef":"0 copies"},"swapTest":{"cpp":true,"java":false,"python":false}}
```

<!-- @highlights -->
- The by-value case draws the caller's box and the parameter box as two separate, unconnected containers.
- The call duplicates the value across, and writing in the function changes only its own box.
- When the function returns, the parameter box is destroyed and the caller's value is exactly as it was.
- The C++ reference case replaces that duplication with a tether, and the parameter box holds no value of its own.
- A write now animates the value changing inside the caller's box itself, because there is only one box.
- The object case draws the caller's box holding an arrow rather than a value, pointing down to a list in the heap.
- The call duplicates the arrow, so two boxes hold two arrows that converge on one single object.
- A method call travels down the parameter's arrow and appends to that shared object.
- The caller's arrow points at the same object, so the change is reachable from both sides.
- A reassignment then constructs a brand new object and swings only the parameter's arrow across to it.
- The caller's arrow does not move, and the frame freezes with two arrows diverging to two different objects.
- That divergence is the whole explanation: mutation reaches the shared object, reassignment moves only the copy.
- The cost panel duplicates all 10,000 elements for a by-value vector, against a single tether and no copies for const reference.

<!-- @edgeCases -->
- Passing an immutable object such as a string or integer, where mutation is impossible so it always behaves like a copy.
- Reassigning a parameter partway through a function, after which further mutations affect only the new object.
- Passing a large container by value in C++, which copies every element and can dominate the function's cost.
- Returning a reference or pointer to a local variable, which is destroyed the moment the function returns.
- A const reference parameter bound to a temporary value, which is legal and extends the temporary's lifetime.
- Passing an array in Java, which is an object, so its elements can be modified through the parameter.
- Swapping two elements inside a shared list, which works, versus swapping two of the caller's variables, which does not.
- A Python default argument that is mutable, where the shared object persists across calls rather than across a single call.
- Passing a nested structure, where the outer container is copied but the inner references still point at shared objects.
- Modifying a collection inside a function while the caller is iterating over it, which breaks the iteration.

<!-- @pitfalls -->
- Concluding a language passes by reference because a list changed inside a function. A copied reference explains it just as well.
- Expecting a reassignment inside a function to be visible to the caller, when only mutation is.
- Trying to write a swap function for two variables in Java or Python, which no signature can express.
- Passing a large vector or string by value in C++ instead of by const reference, copying everything on every call.
- Using plain reference in C++ where const reference was meant, silently permitting modification.
- Returning a reference to a local variable, which leaves the caller holding something that no longer exists.
- Simulating references in Java or Python with one-element arrays when simply returning the value would be clearer.
- Writing functions that quietly modify their arguments, which makes call sites impossible to read at a glance.
- Assuming Python's integers behave differently from its lists because of the passing mechanism, when the real reason is immutability.
- Forgetting that a copied outer container in C++ may still share the objects its elements point to.

<!-- @doubt -->
### Is Java pass by value or pass by reference?

<!-- @answer -->
Strictly pass by value, always. Every argument is copied. What confuses people is what gets copied: for a primitive it is the number, and for an object it is the reference. Copying a reference gives you a second reference to the same object, so mutating that object is visible to the caller — but reassigning the parameter is not. Under true pass by reference both would be visible, which is why the asymmetry proves Java does not have it.

<!-- @doubt -->
### If Java is pass by value, why did my list change inside the function?

<!-- @answer -->
Because the list itself was never passed. Your variable holds a reference to a list object living elsewhere in memory, and the call copied that reference. Now two references exist and both point at the same single object, so calling add travels along either one and reaches the same list. Nothing was passed by reference — a copy of a signpost still leads to the same building.

<!-- @doubt -->
### Can I write a swap function in Java or Python?

<!-- @answer -->
Not for two of the caller's variables, no. There is no syntax for it and no workaround. You can return a pair and have the caller reassign, or swap two elements inside a shared list or array, but no function can reach out and exchange two variables that belong to its caller. C++ can, using reference parameters, and that difference is the clearest proof of which languages have pass by reference.

<!-- @doubt -->
### What is the difference between mutating and reassigning a parameter?

<!-- @answer -->
Mutating changes the object the parameter points at — appending to a list, setting a field. Since the caller points at that same object, the change is visible. Reassigning points the parameter at a different object entirely, which moves only the local copy of the reference and leaves the caller's untouched. This is the same rule from the variables lesson: assignment moves the label, while method calls reach through it.

<!-- @doubt -->
### When should I use const reference in C++?

<!-- @answer -->
Whenever you are passing something large and only reading it, which is most of the time. Passing a vector or string by value copies every element on every call, and that cost is entirely wasted if the function never modifies the data. A const reference avoids the copy while making modification a compile error, so you get the speed of a reference with the safety of a value. Keep small types like int and char by value, where a copy is cheaper than following a reference.

<!-- @doubt -->
### Why can't I change an integer through a parameter in Python?

<!-- @answer -->
Because integers are immutable, not because they are passed differently. Everything in Python is an object and everything is passed the same way — a copy of the reference. The difference is that a list has methods that change it in place, while an integer has none. x = x + 1 cannot modify the object 5; it creates the object 6 and points the local name at it, leaving the caller's name exactly where it was.

<!-- @doubt -->
### Should I write functions that modify their arguments?

<!-- @answer -->
Usually not. A function that returns a value is easier to read, easier to test, and safe to call anywhere, whereas one that quietly modifies its arguments forces every reader to check the implementation before they can trust the call site. Reserve modification for cases where returning is genuinely impractical — a large in-place sort, for instance — and when you do it, make the signature say so. C++'s plain reference parameter is at least visible in the declaration; Java and Python offer no such signal.

<!-- @doubt -->
### What is call by sharing?

<!-- @answer -->
It is the name sometimes given to Python's model, and it means exactly what Java does: the reference is passed by value. It is worth knowing because the phrase avoids an argument — calling Python pass by value is technically right but sounds wrong to anyone who has watched a list change inside a function, while calling it pass by reference is simply incorrect. Call by sharing names the middle case directly: the caller and the function share the object, but each holds its own reference to it.
