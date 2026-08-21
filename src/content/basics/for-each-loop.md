---
id: for-each-loop
topic: Basics
title: For-Each Loop
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-programming
  - data-types
  - variables-and-constants
  - for-loop
relatedIds:
  - for-loop
  - while-loop
  - variables-and-constants
  - break-and-continue
---

<!-- @summary -->
Visiting every element of a collection without managing an index — and understanding that the loop variable is a copy, which is why writing to it usually changes nothing.

<!-- @theory -->
## Iterating without an index

Reading every element of an array with an index works, and it makes you say three
things you don't actually care about:

```
for (int i = 0; i < n; i++) {
    cout << arr[i];
}
```

The start, the bound, and the increment are all scaffolding. What you wanted was
"every element". A **for-each loop** says that directly:

```
for (int value : arr) {
    cout << value;
}
```

No counter to initialise, no bound to get wrong, no `i <= n` off-by-one available to
you. The loop visits each element once and stops. When you don't need positions, this
is both shorter and safer.

| | Syntax | Since |
|---|---|---|
| C++ | `for (int value : arr)` | C++11 |
| Java | `for (int value : arr)` | Java 5 |
| Python | `for value in arr` | always — this *is* Python's for |

Python is the odd one here in a useful way. Its `for` was never a counter loop, as
the for-loop subtopic covered — `for i in range(n)` is already this construct, just
handed a range of numbers instead of a list. So in Python, iterating a collection
directly isn't a special form. It's the normal one, and `range(len(arr))` is the
workaround.

## The loop variable is a copy

This is the part that costs people an afternoon.

```
for (int value : arr) {
    value *= 2;      // arr is unchanged
}
```

`value` is a **new variable**, freshly assigned each iteration from the element. You
doubled the copy. The array never knew.

Java's documentation says it plainly: the loop variable holds a copy of the value,
not the actual array element. C++ behaves the same by default.

This is not a flaw — copying is the right default for reading, which is what most
loops do. It only bites when you assume otherwise.

## Getting write access

**C++ gives you an opt-out.** Add `&` and the loop variable becomes a *reference* —
an alias for the actual element rather than a copy of it:

```
for (int& value : arr) {
    value *= 2;      // arr IS changed
}
```

Three forms worth knowing:

- `for (int value : arr)` — a copy. Reading only.
- `for (int& value : arr)` — a reference. Reading and writing.
- `for (const int& value : arr)` — a reference you promise not to write through.
  Pointless for an `int`, but important for large objects where copying is expensive.

Use `auto` when the type is long or awkward: `for (auto& value : arr)`.

**Java gives you no opt-out for primitives.** There is no reference syntax. If you
need to write to the array, use an indexed loop. (Objects are a partial exception:
the copy is a copy of the *reference*, so you can call methods that mutate the object
— you just cannot replace it with a different one.)

**Python is a third mechanism.** The loop variable is a name bound to the object, so:

```
for value in arr:
    value *= 2        # rebinds the local name — arr unchanged

for row in matrix:
    row.append(0)     # MUTATES the object — matrix IS changed
```

Rebinding does nothing; mutating does. This is the boxes-versus-labels model from
the variables lesson showing up in practice: assignment moves the label, method calls
reach through it.

## What you give up

**No index.** If you need to know *where* you are — comparing to a neighbour, recording
a position, walking two arrays together — a for-each cannot tell you. Python's
`enumerate` gives you both; C++ and Java need an indexed loop.

**Forward only.** There is no way to iterate backwards with a plain for-each. Python
has `reversed()`; C++ and Java need an indexed loop counting down.

**No skipping.** Every element, in order. You cannot step by two or start partway.

## Never modify the collection while iterating it

Adding or removing elements mid-loop breaks the iteration underneath you.

- **Java** detects it and throws `ConcurrentModificationException`.
- **C++** does not check — the behaviour is undefined, which may mean a crash, wrong
  results, or nothing visible at all, depending on the container.
- **Python** does not throw for lists, and silently skips elements as the indices
  shift beneath it. Dicts and sets do raise `RuntimeError`.

The fix in every language: build a new collection, or iterate a copy, or use an
indexed loop walking backwards so removals don't disturb the positions still to come.

## When to use which

| Need | Use |
|---|---|
| Read every element | **for-each** |
| Write to every element | Indexed loop, or C++'s `&` form |
| The index matters | Indexed loop, or Python's `enumerate` |
| Backwards, or by steps | Indexed loop |
| Part of the range | Indexed loop |

Default to for-each when you only need the values. It removes the off-by-one bug
entirely, because there is no bound for you to write wrong.

<!-- @intuition -->
A for-each hands you the value, not the slot it came from. That is why reading works perfectly and writing quietly does nothing — you were given a photograph of the element, and C++'s ampersand is how you ask for the element itself instead.

<!-- @approach -->
### Iterating Values Directly

<!-- @idea -->
Visit every element in order when you need the values and not their positions.

<!-- @steps -->
1. Confirm you need the elements themselves rather than their indices.
2. Declare a loop variable of the element's type.
3. Name the collection to iterate.
4. Each iteration assigns the next element to the loop variable.
5. Use that variable inside the body; the loop stops automatically after the last element.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {3, 7, 1, 9};

    // Read every element
    int sum = 0;
    for (int value : arr) {
        sum += value;
    }
    cout << sum << endl;   // 20

    // auto lets the compiler work out the type
    for (auto value : arr) {
        cout << value << " ";
    }
    cout << endl;          // 3 7 1 9

    // Large objects: take a const reference to avoid copying each one
    vector<string> names = {"alpha", "beta"};
    for (const string& name : names) {
        cout << name << " ";
    }
    cout << endl;

    return 0;
}
```

<!-- @annotations -->
- 10: No counter, no bound, no increment — and therefore no off-by-one available.
- 22: Copying a string every iteration is wasteful. const reference reads without copying and without allowing writes.

<!-- @code java -->
```java
public class ForEachBasics {
    public static void main(String[] args) {
        int[] arr = {3, 7, 1, 9};

        // Read every element
        int sum = 0;
        for (int value : arr) {
            sum += value;
        }
        System.out.println(sum);   // 20

        for (int value : arr) {
            System.out.print(value + " ");
        }
        System.out.println();      // 3 7 1 9

        // Works on anything Iterable, not just arrays
        java.util.List<String> names = java.util.List.of("alpha", "beta");
        for (String name : names) {
            System.out.print(name + " ");
        }
        System.out.println();
    }
}
```

<!-- @annotations -->
- 7: Introduced in Java 5. Internally it uses an iterator for collections.
- 18: Any class implementing Iterable can be used here, which is most of the collections library.

<!-- @code python -->
```python
arr = [3, 7, 1, 9]

# Read every element — this is Python's normal for loop
total = 0
for value in arr:
    total += value
print(total)   # 20

for value in arr:
    print(value, end=" ")
print()        # 3 7 1 9

# Works on anything iterable
for ch in "hello":
    print(ch, end=" ")
print()        # h e l l o

for key in {"a": 1, "b": 2}:
    print(key, end=" ")
print()        # a b

# range(len(arr)) is the workaround here, not the default
for i in range(len(arr)):
    print(arr[i], end=" ")
print()
```

<!-- @annotations -->
- 5: Not a special form in Python — for was always a sequence iterator, never a counter loop.
- 18: Iterating a dict yields its keys. Use .items() when you need keys and values together.
- 23: Correct but unidiomatic. Reach for this only when the index genuinely matters.

<!-- @approach -->
### Modifying Elements: Copy vs Reference

<!-- @idea -->
Understand why writing to the loop variable usually changes nothing, and what each language offers instead.

<!-- @steps -->
1. Recognise that the loop variable is assigned a copy of each element by default.
2. Writing to that copy changes the copy and leaves the collection untouched.
3. In C++, declare the loop variable as a reference to write through to the element.
4. In Java, use an indexed loop, since primitives have no reference form.
5. In Python, distinguish rebinding the name, which does nothing, from calling a method that mutates the object, which does.

<!-- @code cpp -->
```cpp
vector<int> arr = {3, 7, 1, 9};

// THE BUG — value is a copy
for (int value : arr) {
    value *= 2;
}
// arr is still {3, 7, 1, 9}

// THE FIX — & makes value an alias for the element
for (int& value : arr) {
    value *= 2;
}
// arr is now {6, 14, 2, 18}

// auto& works the same and saves writing the type
for (auto& value : arr) {
    value += 1;
}
// arr is now {7, 15, 3, 19}

// const auto& — read-only, but avoids copying large elements
vector<string> names = {"alpha", "beta"};
for (const auto& name : names) {
    cout << name.size() << " ";
    // name = "x";   // would not compile — that is the point of const
}
```

<!-- @annotations -->
- 5: Doubling a copy. The array was never involved.
- 10: The ampersand is the whole difference. value now refers to the element itself.
- 23: const documents the intent and lets the compiler enforce it.

<!-- @code java -->
```java
int[] arr = {3, 7, 1, 9};

// THE BUG — value is a copy, and Java offers no reference form
for (int value : arr) {
    value *= 2;
}
// arr is still {3, 7, 1, 9}

// THE FIX — an indexed loop is the only option for primitives
for (int i = 0; i < arr.length; i++) {
    arr[i] *= 2;
}
// arr is now {6, 14, 2, 18}

// Objects are a partial exception: the copy is a copy of the REFERENCE,
// so you can mutate the object, just not replace it.
java.util.List<java.util.List<Integer>> matrix = new java.util.ArrayList<>();
matrix.add(new java.util.ArrayList<>(java.util.List.of(1, 2)));

for (java.util.List<Integer> row : matrix) {
    row.add(99);        // mutates the object — matrix IS changed
    // row = new ArrayList<>();   // would only rebind the local copy
}
```

<!-- @annotations -->
- 5: Java's documentation states this directly: the loop variable holds a copy of the value.
- 10: There is no int& in Java. Indexing is the answer whenever you need to write.
- 21: Calling a method reaches the real object. Assigning to row would only change the local name.

<!-- @code python -->
```python
arr = [3, 7, 1, 9]

# THE BUG — assigning to the loop variable rebinds a local name
for value in arr:
    value *= 2
print(arr)   # [3, 7, 1, 9] — unchanged

# THE FIX — go through the index
for i in range(len(arr)):
    arr[i] *= 2
print(arr)   # [6, 14, 2, 18]

# Or build a new list, which is more idiomatic
arr = [value * 2 for value in arr]
print(arr)   # [12, 28, 4, 36]

# CRUCIAL DISTINCTION — mutating the object DOES work
matrix = [[1, 2], [3, 4]]
for row in matrix:
    row.append(0)          # method call reaches the real list
print(matrix)              # [[1, 2, 0], [3, 4, 0]]

for row in matrix:
    row = [9, 9]           # assignment only rebinds the local name
print(matrix)              # unchanged by that loop
```

<!-- @annotations -->
- 5: The name value is relabelled; the list element it came from is untouched.
- 14: A list comprehension expresses transform-every-element more directly than any loop.
- 19: Assignment moves the label; a method call reaches through it. Same model as the variables lesson.

<!-- @approach -->
### When You Need the Index or the Position

<!-- @idea -->
Fall back to an indexed loop, or ask for the index explicitly, when the position matters.

<!-- @steps -->
1. Decide whether the body needs the element's position or only its value.
2. If the position is needed, use an indexed loop in C++ or Java.
3. In Python, use enumerate to receive the index and the value together.
4. For backwards iteration or a partial range, use an indexed loop in every language.
5. To walk two collections in step, index both or use a pairing helper.

<!-- @code cpp -->
```cpp
vector<int> arr = {3, 7, 1, 9};
int n = arr.size();

// Position needed — find the index of the first value over 5
int found = -1;
for (int i = 0; i < n; i++) {
    if (arr[i] > 5) { found = i; break; }
}
cout << found << endl;   // 1

// Comparing with the previous element needs positions
for (int i = 1; i < n; i++) {
    if (arr[i] < arr[i - 1]) cout << "drop at " << i << endl;
}

// Backwards — no for-each form exists
for (int i = n - 1; i >= 0; i--) {
    cout << arr[i] << " ";
}
cout << endl;   // 9 1 7 3

// Two collections in step
vector<string> names = {"a", "b", "c", "d"};
for (int i = 0; i < n; i++) {
    cout << names[i] << "=" << arr[i] << " ";
}
cout << endl;
```

<!-- @annotations -->
- 7: A for-each cannot report where it is, so a search that returns a position needs an index.
- 17: Range-based for is forward only. Counting down requires the classic form.

<!-- @code java -->
```java
int[] arr = {3, 7, 1, 9};
int n = arr.length;

// Position needed
int found = -1;
for (int i = 0; i < n; i++) {
    if (arr[i] > 5) { found = i; break; }
}
System.out.println(found);   // 1

// Comparing with the previous element
for (int i = 1; i < n; i++) {
    if (arr[i] < arr[i - 1]) System.out.println("drop at " + i);
}

// Backwards — the enhanced for is forward only
for (int i = n - 1; i >= 0; i--) {
    System.out.print(arr[i] + " ");
}
System.out.println();   // 9 1 7 3

// Two collections in step
String[] names = {"a", "b", "c", "d"};
for (int i = 0; i < n; i++) {
    System.out.print(names[i] + "=" + arr[i] + " ");
}
System.out.println();
```

<!-- @annotations -->
- 17: Java's documentation lists forward-only iteration as an explicit limitation.

<!-- @code python -->
```python
arr = [3, 7, 1, 9]

# enumerate gives the index and the value together
for i, value in enumerate(arr):
    if value > 5:
        print(i)   # 1
        break

# Start the index somewhere other than 0
for i, value in enumerate(arr, start=1):
    print(i, value)   # 1 3 / 2 7 / 3 1 / 4 9

# Comparing with the previous element still needs positions
for i in range(1, len(arr)):
    if arr[i] < arr[i - 1]:
        print("drop at", i)

# Backwards — reversed() keeps the for-each form
for value in reversed(arr):
    print(value, end=" ")
print()   # 9 1 7 3

# Two collections in step — zip pairs them without indices
names = ["a", "b", "c", "d"]
for name, value in zip(names, arr):
    print(f"{name}={value}", end=" ")
print()
```

<!-- @annotations -->
- 4: Cleaner than range(len(arr)) and it states that both pieces are wanted.
- 19: Python keeps the for-each form for reversal, which C++ and Java cannot.
- 25: zip stops at the shorter collection, so mismatched lengths truncate rather than error.

<!-- @example -->

<!-- @input -->
arr = [3, 7, 1, 9]; for (int value : arr) sum += value;

<!-- @output -->
20

<!-- @why -->
The read-only case, which is what for-each is for and where it is strictly better than an indexed loop.

<!-- @walkthrough -->
1. The loop takes the first element, 3, and assigns it to value.
2. The body adds 3 to sum, making it 3.
3. The next element, 7, is assigned to value and added, making sum 10.
4. The next element, 1, brings sum to 11, and the last element, 9, brings it to 20.
5. There are no more elements, so the loop ends without any bound being checked by the programmer.
6. No index was ever created, so no off-by-one was possible.

<!-- @example -->

<!-- @input -->
arr = [3, 7, 1, 9]; for (int value : arr) value *= 2;

<!-- @output -->
arr is still [3, 7, 1, 9] — nothing changed

<!-- @why -->
The universal for-each bug. It fails silently in all three languages, which is why the copy semantics have to be understood rather than memorised.

<!-- @walkthrough -->
1. The first element, 3, is copied into the loop variable value.
2. The body doubles value to 6, which modifies the copy and not the array slot it came from.
3. The iteration ends and that copy is discarded.
4. The next element is copied into value, doubled, and discarded in exactly the same way.
5. After all four iterations the array holds the values it started with.
6. No error is reported at any point — the code did precisely what it said, which was to modify a copy.

<!-- @example -->

<!-- @input -->
The same doubling written with C++'s reference form: for (int& value : arr)

<!-- @output -->
arr becomes [6, 14, 2, 18]

<!-- @why -->
Shows the fix is a genuine language feature in C++ and simply unavailable in the other two, which decides how the same task is written in each.

<!-- @walkthrough -->
1. The ampersand makes value a reference, meaning it is an alias for the element rather than a copy of it.
2. Assigning to value writes through that alias directly into the array slot.
3. The first element becomes 6, the second 14, the third 2 and the fourth 18.
4. Nothing is copied and nothing is discarded at the end of each iteration.
5. Java has no equivalent for primitives, so the same fix there requires an indexed loop.
6. Python has no equivalent either, since assignment rebinds a name rather than writing to a location.

<!-- @example -->

<!-- @input -->
matrix = [[1, 2], [3, 4]]; for row in matrix: row.append(0)

<!-- @output -->
matrix becomes [[1, 2, 0], [3, 4, 0]] — this one does change

<!-- @why -->
The exception that makes the rule make sense, and it is the boxes-versus-labels model from the variables lesson applied to iteration.

<!-- @walkthrough -->
1. The loop binds the name row to the first inner list object.
2. Calling append is a method call on that object, which reaches the real list rather than a copy.
3. The inner list gains a 0, and the change is visible through matrix because there is only one list.
4. The same happens for the second inner list.
5. Writing row = [9, 9] instead would rebind the local name and leave matrix untouched.
6. So mutating works and reassigning does not — the difference is whether you reach through the label or move it.

<!-- @visualization memory-model -->

<!-- @description -->
Draw the collection as a row of labelled memory cells with their values inside, and the loop variable as a separate box below. The COPY panel animates each iteration as a value being duplicated out of the current cell and dropped into the loop variable box, with the arrow explicitly drawn as a one-way copy and the source cell staying visually intact. When the body writes to the box, only the box changes — animate the new value appearing there while the cell above stays untouched, then fade the box's contents out at the end of the iteration to show the copy being discarded. Repeating this for all four cells leaves the collection row identical to how it started, which is the bug shown as a mechanism rather than a rule. The REFERENCE panel replaces the copy arrow with a tether: the loop variable box is drawn as an outline with no value of its own, connected to the current cell by a visible link, so it reads as an alias rather than a container. Writing now animates the value changing inside the cell itself, with the box merely a handle on it, and the collection row visibly updates as the loop advances. Label the panels with which languages offer which: copy is the default everywhere, reference is available in C++ via the ampersand, and Java and Python have no reference form. Add a PYTHON panel showing the third mechanism — the loop variable as a tag with an arrow pointing at an object, where assignment swings the arrow to a new object and leaves the original untouched, while a method call travels along the arrow and modifies the object in place, so mutation succeeds where reassignment fails.

<!-- @sampleInput -->
```json
{"collection":[3,7,1,9],"operation":"value *= 2","modes":[{"name":"copy","syntax":{"cpp":"for (int value : arr)","java":"for (int value : arr)","python":"for value in arr"},"writesReachCollection":false,"result":[3,7,1,9]},{"name":"reference","syntax":{"cpp":"for (int& value : arr)","java":null,"python":null},"writesReachCollection":true,"result":[6,14,2,18]}],"pythonObject":{"collection":[[1,2],[3,4]],"mutate":"row.append(0)","mutateResult":[[1,2,0],[3,4,0]],"rebind":"row = [9,9]","rebindResult":[[1,2,0],[3,4,0]]}}
```

<!-- @highlights -->
- The collection is drawn as four cells holding 3, 7, 1 and 9, with an empty loop variable box below.
- The copy panel duplicates the value out of the first cell into the box, with the cell staying visually intact.
- The body doubles the box to 6 while the cell above still reads 3 — only the copy changed.
- At the end of the iteration the box empties, discarding that copy entirely.
- After all four iterations the collection row is identical to its starting state.
- The reference panel replaces the copy arrow with a tether, and the box is drawn as an outline holding nothing of its own.
- Writing through the tether changes the value inside the cell itself, and the collection row updates as the loop advances.
- Labels mark availability: copy is the default in all three languages, the reference form exists only in C++.
- The Python panel draws the loop variable as a tag with an arrow pointing at an object.
- Assignment swings the arrow to a brand new object, leaving the original in the collection untouched.
- A method call instead travels along the arrow and modifies the object in place, so the collection does change.
- Mutating succeeds and reassigning fails, which is the same label model the variables lesson established.

<!-- @edgeCases -->
- An empty collection, where the body runs zero times without any special handling.
- A single-element collection, where the loop runs exactly once.
- Writing to the loop variable in a copy-based loop, which changes nothing in the collection and reports no error.
- Modifying the collection's size while iterating it, which is detected in Java, undefined in C++, and silently skips elements for Python lists.
- Removing from a Python list while iterating it, where the indices shift underneath and elements are passed over.
- Iterating a Python dict or set while modifying it, which raises RuntimeError unlike the list case.
- Iterating a collection of large objects by value in C++, which copies each one and can be a real cost.
- Iterating an array of objects in Java, where the copied reference still allows mutation of the object.
- Using zip on collections of different lengths in Python, which stops at the shorter one rather than raising.
- Needing to compare an element with its neighbour, which a for-each cannot express because it has no position.

<!-- @pitfalls -->
- Assigning to the loop variable and expecting the collection to change. The variable is a copy in all three languages.
- Forgetting the ampersand in C++ when the loop is meant to modify elements.
- Looking for a reference form in Java for primitives, which does not exist — an indexed loop is the only option.
- Confusing rebinding with mutating in Python: row = [] does nothing, while row.append() changes the real object.
- Adding to or removing from a collection while iterating over it.
- Iterating large objects by value in C++ instead of by const reference, which copies every element needlessly.
- Reaching for a for-each when the index is needed, then reconstructing the position with a manual counter.
- Using range(len(arr)) in Python purely to read values, when iterating directly is clearer.
- Expecting a for-each to iterate backwards, which no language supports without reversed() or an indexed loop.
- Assuming the loop variable survives after the loop, which it does in Python but not in C++ or Java.

<!-- @doubt -->
### I changed the loop variable but the array is unchanged. Why?

<!-- @answer -->
Because the loop variable is a copy of the element, not the element itself. Each iteration assigns a fresh copy, your body modifies that copy, and it is discarded when the iteration ends. The array was never involved. In C++ you can opt out by declaring the variable as a reference with an ampersand. In Java there is no reference form for primitives, so you need an indexed loop. In Python, assignment rebinds a local name, so you index or build a new list.

<!-- @doubt -->
### When should I use a for-each instead of an indexed loop?

<!-- @answer -->
Whenever you need the values and not their positions. It removes the counter, the bound and the increment, which removes the off-by-one bug entirely — there is no bound left for you to write wrong. Switch to an indexed loop when the position matters: searching for an index, comparing against a neighbour, walking backwards, stepping by more than one, or covering only part of the range.

<!-- @doubt -->
### What does the ampersand do in C++'s range-based for?

<!-- @answer -->
It makes the loop variable a reference, meaning it is an alias for the actual element rather than a copy of it. Writing through it changes the collection. There are three useful forms: plain for reading a copy, ampersand for reading and writing the real element, and const with an ampersand for reading a large object without copying it. That last one matters for strings and objects, where copying every element is genuine wasted work.

<!-- @doubt -->
### Why does row.append() change my Python list when row = [] doesn't?

<!-- @answer -->
Because they do different things. The loop variable is a name pointing at an object. Calling a method travels along that pointer and modifies the object itself, and since the collection holds the same object, the change is visible there. Assigning to the name instead points it at a different object and leaves the original untouched. This is the same distinction as the variables lesson: assignment moves the label, method calls reach through it.

<!-- @doubt -->
### Can I get the index in a for-each loop?

<!-- @answer -->
Not directly — that is precisely what the construct gives up. Python offers enumerate, which yields the index and the value together and is cleaner than range(len(arr)). C++ and Java have no equivalent, so use an indexed loop when the position matters. Keeping a manual counter alongside a for-each works but reproduces the indexed loop with more moving parts, so prefer the real thing.

<!-- @doubt -->
### Why can't I remove items from a collection while looping over it?

<!-- @answer -->
Because the iteration is tracking a position that your removal invalidates. Java detects this and throws ConcurrentModificationException. C++ leaves it undefined, which can mean a crash, wrong results, or nothing visible depending on the container. Python is the most dangerous case for lists: it raises nothing and silently skips elements as the indices shift. Build a new collection with the survivors, iterate over a copy, or walk backwards with an index so removals do not disturb positions you have yet to visit.

<!-- @doubt -->
### Can a for-each iterate backwards?

<!-- @answer -->
Not on its own. Java's documentation lists forward-only iteration as an explicit limitation, and C++ range-based for is the same. Python keeps the for-each form using reversed(), which is the cleanest of the three. In C++ and Java, counting down with an indexed loop from n minus one to zero is the standard answer.

<!-- @doubt -->
### Is Python's for loop a for-each?

<!-- @answer -->
Yes, and it always was. Python never had a counter loop — for i in range(n) is this same construct handed a range of numbers rather than a list. That is why for value in arr is the normal form there rather than a special one, and why range(len(arr)) reads as the workaround. C++ and Java added their versions later, in C++11 and Java 5, on top of an existing counter loop.
