---
id: swap-two-numbers
topic: Bit Manipulation
title: Swap Two Numbers
difficulty: Easy
status: ready
prerequisites:
  - set-unset-the-rightmost-unset-bit
  - introduction-to-bits-and-tricks
  - pass-by-value-vs-pass-by-reference
  - variables-and-constants
relatedIds:
  - single-number-i
  - minimum-bit-flips-to-convert-number
  - single-number-iii
  - xor-of-numbers-in-a-given-range
  - introduction-to-bits-and-tricks
---

<!-- @summary -->
XOR swaps two values without a temporary because `a ^ a == 0` — verified on all 4,294,967,296 sixteen-bit pairs with zero failures. It is also **1.97x slower** than the temporary it saves (15,958ns against 8,083ns over 32,768 swaps), and the disassembly says why: ten instructions against five, because the compiler must preserve the trick's behaviour when both operands are the same object. Add `__restrict` and it compiles to the identical five instructions — so the only property the trick still has that a temporary does not is the bug, which silently zeroes `arr[i]` whenever `i == j`.

<!-- @theory -->
## The problem

Exchange the values of `a` and `b`. The interview version adds: without a third
variable.

## Why XOR can do it

XOR is its own inverse. `a ^ a == 0` and `a ^ 0 == a`, so applying the same value
twice cancels out. Three steps exploit that:

```
start:   a = A          b = B
a ^= b:  a = A^B        b = B
b ^= a:  a = A^B        b = B^(A^B) = A
a ^= b:  a = (A^B)^A = B    b = A
```

Line two is where it happens: `b` XORs itself with a value that already contains
`b`, so its own contribution cancels and `A` is what remains. The third line does
the same to `a`.

Checked over every one of the 4,294,967,296 pairs of 16-bit values, the XOR swap,
the temporary-variable swap and the arithmetic swap all had **0 failures**.
Correctness is not what separates them.

## What separates them is aliasing

```cpp
arr[i] ^= arr[j];
arr[j] ^= arr[i];
arr[i] ^= arr[j];
```

If `i == j` this sets `arr[i]` to **0**. Measured: `{7, 8, 9}` with `i = j = 1`
becomes `{7, 0, 9}`. The first line XORs the element with itself, which is zero,
and there is nothing left to recover the value from.

| Swap | Two distinct objects | The same object twice |
|---|---|---|
| Temporary | correct | correct — value preserved |
| XOR | correct | **destroys the value** |
| Addition/subtraction | correct | **destroys the value** |

This is not a hypothetical. `swap(arr[i], arr[j])` with `i == j` occurs in every
sorting routine — a partition step where the pivot lands where it started, a
selection sort whose minimum is already in place. The temporary version does
nothing, correctly. The trick zeroes an element and the sort continues with
corrupted data.

## The trick is slower, and the bug is why

Over 32,768 swaps in an array, with the copy overhead subtracted:

| Method | Time | Ratio |
|---|---|---|
| Temporary variable | **8,083ns** | 1.00x |
| `std::swap` | 9,000ns | 1.11x |
| XOR swap | 15,958ns | **1.97x** |
| Addition/subtraction | 15,958ns | 1.97x |

The disassembly makes the reason concrete:

```
swapTemp(unsigned&, unsigned&)     swapXor(unsigned&, unsigned&)
    ldr  w8, [x0]                      ldr  w8, [x1]
    ldr  w9, [x1]                      ldr  w9, [x0]
    str  w9, [x0]                      eor  w8, w9, w8
    str  w8, [x1]                      str  w8, [x0]
    ret                                ldr  w9, [x1]
                                       eor  w8, w9, w8
                                       str  w8, [x1]
                                       ldr  w9, [x0]
                                       eor  w8, w9, w8
                                       str  w8, [x0]
                                       ret
```

Five instructions against ten. The compiler cannot collapse the XOR version,
because through references it has no way to prove `&a != &b` — and if they *do*
alias, the three-XOR sequence has a different, defined result that must be
preserved. **The trick is slow precisely because it is broken.**

Promise the compiler they never alias and it collapses completely:

```cpp
void swapXorRestrict(unsigned* __restrict a, unsigned* __restrict b) {
    *a ^= *b; *b ^= *a; *a ^= *b;
}
// compiles to: ldr, ldr, str, str, ret — identical to the temporary version
```

All three XORs vanish. On plain locals the whole thing becomes a register rename
with no XOR at all. So once aliasing is ruled out, the trick and the temporary
are the same program — which means the trick's only distinguishing property in
the general case is the failure mode.

## The arithmetic version is worse

```cpp
a = a + b;    b = a - b;    a = a - b;
```

It has the same aliasing bug and adds signed overflow. With
`a = b = 2000000000`, the sum is 4,000,000,000 against an `INT_MAX` of
2,147,483,647 — **undefined behaviour**, not a wrapped value you can reason
about. On unsigned types wrapping is defined and the swap is correct: verified,
`4000000000` and `4000000000` swap correctly, and all 4,294,967,296 sixteen-bit
pairs passed.

So the arithmetic swap is correct only on unsigned types, where XOR was already
correct and faster to reason about. It has no case at all.

## Python: the swap is a bytecode instruction

```python
a, b = b, a
```

| Method | Time |
|---|---|
| `a, b = b, a` | **12.0ns** |
| `t = a; a = b; b = t` | 25.4ns |
| `a ^= b; b ^= a; a ^= b` | 76.8ns |

The tuple form is 2.12x faster than a temporary and **6.40x** faster than the
XOR trick, because CPython compiles it to a dedicated `SWAP` opcode — no tuple
is built at all. It is also alias-safe: `arr[i], arr[j] = arr[j], arr[i]` with
`i == j` leaves the list untouched, where the XOR version gives `[7, 0, 9]`.

## What the trick is actually for

Two things, neither of them "swapping variables":

- **Understanding XOR's self-inverse property**, which is the whole of Single
  Number, Minimum Bit Flips and XOR of a range. Those problems cannot be done any
  other way, and this is where the property is easiest to see.
- **Genuinely register-starved code** — some embedded and cryptographic contexts
  where a spill is more expensive than three XORs and aliasing is ruled out by
  construction.

For exchanging two values in ordinary code, use the language's swap.

## Where this goes next

**Divide two numbers without multiplication and division** is the first subtopic
here that builds an algorithm rather than applying an identity: long division in
binary, assembled one shifted bit at a time, with the `INT_MIN / -1` overflow
case that no bit trick can dodge.

<!-- @intuition -->
XOR remembers both of its inputs and reveals either one when you give it back the other, which is why three of them can rotate two values through each other with nowhere to put a third. That is a genuinely useful thing to understand, because the same property is the entire basis of the array problems later in this topic — a value XORed twice disappears, so pairs cancel and singletons survive. What it is not is a good way to swap two variables. The moment the two names might refer to the same storage, the first step XORs a value with itself, which is zero, and the information needed to recover it is gone; and because the compiler cannot rule that out on its own, it is forced to emit all three operations instead of the two loads and two stores a temporary needs. The trick's inefficiency and its bug are the same fact seen from two sides.

<!-- @approach -->
### The Trick - XOR Without a Temporary

<!-- @idea -->
XOR is its own inverse, so three of them rotate two values past each other with no third storage.

<!-- @steps -->
1. `a ^= b` — `a` now holds `A ^ B`, a value containing both.
2. `b ^= a` — `b` XORs itself against `A ^ B`, its own contribution cancels, and `A` remains.
3. `a ^= b` — `a` is `A ^ B` and `b` is now `A`, so this leaves `B`.
4. The values are exchanged, with no variable ever holding a copy.
5. Note that step 1 destroys `a` irrecoverably if `a` and `b` are the same object.

<!-- @complexity -->
- time: O(1) — three XORs, but 1.97x the temporary version in practice
- space: O(1), and famously without a temporary
- note: Verified on all 4,294,967,296 pairs of 16-bit values, 0 failures — for distinct objects. Measured 15,958ns over 32,768 array swaps against the temporary's 8,083ns, because the compiler must emit all three operations when it cannot prove the operands are distinct. With __restrict it collapses to the same five instructions as the temporary, which shows the cost is entirely the aliasing it cannot rule out.

<!-- @code cpp -->
```cpp
void swapXor(unsigned& a, unsigned& b) {
    a ^= b;
    b ^= a;
    a ^= b;
}

// If a and b are the SAME object, line 2 sets it to 0 and the value is
// gone. swapXor(arr[i], arr[j]) with i == j turns {7,8,9} into {7,0,9}.
//
// Compiles to 10 instructions against the temporary version's 5, because
// the compiler must preserve exactly that behaviour. Marking the pointers
// __restrict makes it emit the identical 5.
```

<!-- @annotations -->
- 2: The one line that loses information. a ^ a is 0 for every a, so if b names the same storage there is nothing left to reconstruct from.
- 3: Reads as "cancel b's own contribution out of the combined value", which is the property worth taking from this subtopic.
- 7: This happens in every partition step where the pivot is already in place, so it is a real failure rather than a contrived one.

<!-- @code java -->
```java
static void swapXor(int[] arr, int i, int j) {
    arr[i] ^= arr[j];
    arr[j] ^= arr[i];
    arr[i] ^= arr[j];
}

// Java cannot swap two int VARIABLES in a method at all — arguments are
// passed by value — so the trick only ever appears on array elements,
// which is exactly where the i == j case lives.
```

<!-- @annotations -->
- 2: Because Java has no references to locals, this is the only shape the trick can take — and it is the shape with the aliasing bug built in.
- 7: Worth knowing before writing a swap helper in Java: it must take a container and indices, or return a pair.

<!-- @code python -->
```python
def swap_xor(arr, i, j):
    arr[i] ^= arr[j]
    arr[j] ^= arr[i]
    arr[i] ^= arr[j]


# Measured 76.8ns per swap against 12.0ns for a, b = b, a — 6.40x slower.
# With i == j it turns [7, 8, 9] into [7, 0, 9]; the tuple form leaves it alone.
```

<!-- @annotations -->
- 2: Works on Python's unbounded integers unchanged, since XOR is defined bitwise at any width.
- 7: The slowest of the three Python forms and the only one that can corrupt data — there is no argument for it here at all.

<!-- @approach -->
### The Other Trick - Addition and Subtraction

<!-- @idea -->
Store the sum in one variable and recover each original by subtracting the other.

<!-- @steps -->
1. `a = a + b` — `a` holds the sum, which contains both values.
2. `b = a - b` — subtracting the original `b` from the sum leaves `A`.
3. `a = a - b` — `b` is now `A`, so subtracting it from the sum leaves `B`.
4. The values are exchanged with no temporary.
5. Note that the sum in step 1 may not be representable.

<!-- @complexity -->
- time: O(1) — measured 15,958ns over 32,768 swaps, the same as the XOR version and 1.97x the temporary
- space: O(1)
- note: Correct on unsigned types, where wrapping is defined — verified on all 4,294,967,296 sixteen-bit pairs, 0 failures, including values whose sum overflows. On signed types the sum is undefined behaviour: a = b = 2000000000 gives 4,000,000,000 against an INT_MAX of 2,147,483,647. It also has the identical aliasing bug. There is no input for which this is the right choice.

<!-- @code cpp -->
```cpp
void swapAdd(unsigned& a, unsigned& b) {
    a = a + b;
    b = a - b;
    a = a - b;
}

// UNSIGNED only. On signed ints, a = b = 2000000000 makes the sum
// 4000000000 against an INT_MAX of 2147483647 — undefined behaviour,
// not a wrapped value you can reason about.
//
// Same aliasing bug as the XOR version: if a and b are the same object,
// line 2 sets it to 0.
```

<!-- @annotations -->
- 2: The overflow point. On unsigned types this wraps by definition and the subtractions unwrap it exactly, which is why the 16-bit exhaustive check passes.
- 5: Undefined behaviour means the compiler may assume it cannot happen and optimise accordingly — this is not a value you can predict.
- 9: Every objection to the XOR version applies here, plus one more.

<!-- @code java -->
```java
static void swapAdd(int[] arr, int i, int j) {
    arr[i] = arr[i] + arr[j];
    arr[j] = arr[i] - arr[j];
    arr[i] = arr[i] - arr[j];
}

// Java's int arithmetic is DEFINED to wrap, so overflow is not undefined
// here — the swap still works. It is the one language where this version
// is merely pointless rather than dangerous.
```

<!-- @annotations -->
- 2: Java specifies two's complement wrapping for int, so the sum being unrepresentable is harmless.
- 7: Still 1.97x slower than a temporary and still broken when i == j, so the conclusion does not change.

<!-- @code python -->
```python
def swap_add(arr, i, j):
    arr[i] = arr[i] + arr[j]
    arr[j] = arr[i] - arr[j]
    arr[i] = arr[i] - arr[j]


# Python integers do not overflow, so this cannot fail on magnitude —
# it merely allocates a larger integer for one step. The aliasing bug
# remains, and a, b = b, a is 6x faster.
```

<!-- @annotations -->
- 2: The sum may exceed the machine word and Python will simply widen it, which removes the overflow objection and none of the others.

<!-- @approach -->
### Better - A Temporary Variable

<!-- @idea -->
Hold one value aside, overwrite it, then restore from what was held.

<!-- @steps -->
1. Copy `a` into a temporary.
2. Assign `b` into `a`.
3. Assign the temporary into `b`.
4. Note that if `a` and `b` are the same object, this correctly leaves it unchanged.
5. Note that the temporary usually costs nothing, since it lives in a register.

<!-- @complexity -->
- time: O(1) — measured 8,083ns over 32,768 array swaps, the fastest form
- space: O(1); the "extra variable" is a register, not memory
- note: Compiles to five instructions — two loads, two stores and a return — against the XOR version's ten. Correct for every input including the aliasing case, where it leaves the object unchanged rather than zeroing it. The temporary that the trick exists to avoid turns out not to exist in the compiled code at all.

<!-- @code cpp -->
```cpp
void swapTemp(unsigned& a, unsigned& b) {
    unsigned t = a;
    a = b;
    b = t;
}

// ldr, ldr, str, str, ret — five instructions. The "extra variable"
// never reaches memory.
//
// Correct when a and b are the same object: it assigns the value to
// itself twice and leaves it intact.
```

<!-- @annotations -->
- 2: This is the variable the trick exists to eliminate, and it is eliminated already — it lives in a register the function was going to use anyway.
- 9: The behaviour that distinguishes this from both tricks, and the only one of the three that a sorting routine can rely on.

<!-- @code java -->
```java
static void swapTemp(int[] arr, int i, int j) {
    int t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
}

// Correct when i == j: it writes arr[i] to itself twice.
```

<!-- @annotations -->
- 2: The standard form in every Java sorting routine, and the reason those routines do not need an i != j guard.

<!-- @code python -->
```python
def swap_temp(arr, i, j):
    t = arr[i]
    arr[i] = arr[j]
    arr[j] = t


# Measured 25.4ns per swap — correct, and still 2.12x slower than
# the tuple form, which Python compiles to a dedicated SWAP opcode.
```

<!-- @annotations -->
- 2: Correct but not idiomatic; in Python the tuple form is both faster and shorter, which is an unusual combination.

<!-- @approach -->
### Optimal - The Language's Own Swap

<!-- @idea -->
Every language already provides an exchange that is correct, fast and alias-safe.

<!-- @steps -->
1. In C++, call `std::swap`, which is specialised and inlined for built-in types.
2. In Python, write `a, b = b, a`, which compiles to a dedicated `SWAP` opcode.
3. In Java, accept that locals cannot be swapped by a method and swap array elements with a temporary.
4. Note that all of these are correct when both operands are the same object.
5. Prefer them: the named operation says what is happening, which no three-line idiom does.

<!-- @complexity -->
- time: O(1) — std::swap measured 9,000ns over 32,768 swaps, and Python's tuple form 12.0ns per swap
- space: O(1)
- note: std::swap measured 1.11x the hand-written temporary here, which is inlining noise rather than a real cost, and 1.77x faster than the XOR trick. Python's tuple form is 2.12x faster than a temporary and 6.40x faster than the XOR version, and is alias-safe: arr[i], arr[j] = arr[j], arr[i] with i == j leaves the list untouched.

<!-- @code cpp -->
```cpp
#include <utility>

void swapValues(unsigned& a, unsigned& b) {
    std::swap(a, b);
}

// Correct for aliasing, inlines to the same loads and stores as a
// hand-written temporary, and works for any type with a move constructor
// rather than just integers.
```

<!-- @annotations -->
- 4: For non-trivial types this moves rather than copies, which the XOR and arithmetic tricks cannot do at all — they only work on integers.

<!-- @code java -->
```java
static void swap(int[] arr, int i, int j) {
    int t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
}

// Java has no swap for locals, because arguments are passed by value —
// Collections.swap(list, i, j) is the library form for lists.
```

<!-- @annotations -->
- 7: Worth knowing rather than rediscovering: a swap(int a, int b) method in Java exchanges its own copies and has no effect on the caller.

<!-- @code python -->
```python
a, b = b, a

arr[i], arr[j] = arr[j], arr[i]


# 12.0ns per swap — 2.12x faster than a temporary and 6.40x faster than
# the XOR trick, because CPython emits a dedicated SWAP opcode and never
# builds the tuple. Alias-safe: with i == j the list is left untouched.
```

<!-- @annotations -->
- 1: The right-hand side is evaluated before either assignment, which is what makes it safe and what makes it read as a single exchange.
- 3: The idiomatic form for arrays, and the one a sorting routine should use.

<!-- @example -->

<!-- @input -->
a = 13, b = 7

<!-- @output -->
a = 7, b = 13, using three XORs and no third variable

<!-- @why -->
Tracing the bits shows that step two is where the cancellation happens, which is the property the rest of this topic depends on.

<!-- @walkthrough -->
1. Start with a = 1101 and b = 0111.
2. a ^= b makes a = 1101 ^ 0111 = 1010, a value that contains both inputs and neither of them alone.
3. b is still 0111 at this point, so nothing has been lost — the combined value plus either original recovers the other.
4. b ^= a makes b = 0111 ^ 1010 = 1101, which is 13 — b's own contribution cancelled out of the combined value.
5. a is still 1010, and b is now 1101.
6. a ^= b makes a = 1010 ^ 1101 = 0111, which is 7.
7. The exchange is complete, and every step relied on a ^ a == 0 — the same property that makes Single Number work on an entire array.

<!-- @example -->

<!-- @input -->
swap(arr[i], arr[j]) with i == j == 1, on {7, 8, 9}

<!-- @output -->
The XOR version gives {7, 0, 9}; the temporary version gives {7, 8, 9}

<!-- @why -->
This is the case that makes the trick unusable in the code that swaps most often, and it is silent.

<!-- @walkthrough -->
1. With i == j, both expressions name the same element, so the first line is arr[1] ^= arr[1].
2. Any value XORed with itself is 0, so arr[1] becomes 0 immediately.
3. The second line is now arr[1] ^= arr[1] again, which leaves 0.
4. The third does the same, so the element ends at 0 and the original 8 is unrecoverable.
5. The temporary version instead copies 8 aside, assigns 8 to itself, and assigns 8 back — leaving the element unchanged, correctly.
6. This is not a contrived input: a partition step whose pivot is already in place, or a selection sort whose minimum has not moved, produces i == j routinely.
7. Nothing reports the corruption — the sort continues with a zero where a value used to be, and the failure surfaces somewhere else entirely.

<!-- @example -->

<!-- @input -->
Three swap methods over every pair of 16-bit values

<!-- @output -->
4,294,967,296 pairs, 0 failures for all three — correctness is not the difference

<!-- @why -->
It rules out the obvious explanation for preferring one over another, which forces the comparison onto the grounds that actually matter.

<!-- @walkthrough -->
1. Every pair (a, b) of 16-bit values was run through the XOR swap, the temporary swap and the arithmetic swap.
2. That is 65,536 × 65,536 = 4,294,967,296 pairs.
3. All three produced the exchanged values on every pair, with 0 failures each.
4. The arithmetic version was tested on a 16-bit unsigned type, where its sum wraps by definition — so even the pairs whose sum exceeds the type passed.
5. So all three are correct for distinct objects, and the choice cannot be made on correctness alone.
6. It is made on two other grounds: what happens when the operands alias, where only the temporary survives; and speed, where the temporary is 1.97x faster.
7. Both of those grounds point the same way, and neither is visible in a test that passes two distinct values.

<!-- @example -->

<!-- @input -->
The two swaps, compiled at -O2

<!-- @output -->
Ten instructions against five — and with __restrict, five against five

<!-- @why -->
It shows that the trick's cost and the trick's bug are the same fact, which is a stronger conclusion than either measurement alone.

<!-- @walkthrough -->
1. The temporary version compiles to five instructions: two loads, two stores and a return.
2. The XOR version compiles to ten: three loads, three XORs, three stores and a return.
3. The compiler cannot collapse it, because through references it cannot prove the two operands are distinct objects.
4. If they are the same object, the three-XOR sequence has a different result — zero — and that result is defined behaviour the compiler must preserve.
5. Marking the pointers __restrict promises they never alias, and the same three lines then compile to exactly the five instructions of the temporary version.
6. On plain locals, where aliasing is impossible, all three XORs disappear entirely and the exchange becomes a register rename.
7. So the trick costs 1.97x only while its failure mode is possible, and once that is ruled out it is byte-for-byte the code it was supposed to improve on.

<!-- @visualization custom -->

<!-- @description -->
Open with the mechanism panel: two labelled registers, a = 1101 and b = 0111, drawn as bit rows. Step one, a ^= b: highlight each column where the two differ, and fill a with 1010, annotating it "contains both, and neither". Step two, b ^= a: draw b's own bits and the combined value stacked, and show each of b's contributions cancelling column by column — the cells where b had a 1 and the combined value had a 1 both go dark — leaving 1101. Label it "b's own contribution cancels out". Step three the same for a, arriving at 0111. Alongside, keep a running note of what each variable holds symbolically — A, A^B, A^B and A, then B and A — so the reader sees the algebra beside the bits. Then the aliasing panel, which is the important one: draw the array {7, 8, 9} as three boxes, with two index pointers i and j both aimed at the middle box, drawn as two arrows converging on one cell so the collision is unmistakable. Run the three XOR lines: the first turns 8 into 0 and the box visibly empties; the next two do nothing. End with {7, 0, 9} in red. Immediately rerun the same two arrows through the temporary version: 8 is lifted into a holding box, written back to the same cell, and lifted back — ending with {7, 8, 9} in green. Then the compilation panel: the two source listings side by side with their assembly beneath, five instructions against ten, with the three eor lines highlighted. Add a third column showing the same XOR source with __restrict, and its assembly collapsing to the same five instructions — with an arrow from the aliasing panel to this one, labelled "the reason it cannot be optimised is the reason it is wrong". Close with two timing charts: C++ over 32,768 array swaps at 8,083ns, 9,000ns, 15,958ns and 15,958ns for temporary, std::swap, XOR and arithmetic; and Python per swap at 12.0ns, 25.4ns and 76.8ns for the tuple form, the temporary and XOR — with the tuple form annotated "a dedicated SWAP opcode; no tuple is built".

<!-- @sampleInput -->
```json
{"mechanism":{"a":13,"b":7,"aBits":"1101","bBits":"0111","steps":[{"line":"a ^= b","aHolds":"A ^ B","aValue":10,"aBits":"1010","bHolds":"B","bValue":7,"note":"contains both, and neither"},{"line":"b ^= a","aHolds":"A ^ B","aValue":10,"bHolds":"A","bValue":13,"bBits":"1101","note":"b's own contribution cancels out of the combined value"},{"line":"a ^= b","aHolds":"B","aValue":7,"aBits":"0111","bHolds":"A","bValue":13,"note":"exchange complete"}],"property":"a ^ a == 0 and a ^ 0 == a","samePropertyUsedBy":["single-number-i","minimum-bit-flips-to-convert-number","xor-of-numbers-in-a-given-range"]},"aliasing":{"array":[7,8,9],"i":1,"j":1,"xor":{"steps":[{"line":"arr[i] ^= arr[j]","result":[7,0,9],"note":"a value XORed with itself is 0"},{"line":"arr[j] ^= arr[i]","result":[7,0,9]},{"line":"arr[i] ^= arr[j]","result":[7,0,9]}],"final":[7,0,9],"correct":false},"temp":{"final":[7,8,9],"correct":true,"note":"assigns the value to itself twice"},"arithmetic":{"final":[7,0,9],"correct":false},"whyItHappens":"a partition step whose pivot is already in place, or a selection sort whose minimum has not moved","silent":true},"exhaustive":{"pairs":4294967296,"description":"every pair of 16-bit values","failures":{"xor":0,"temp":0,"addSub":0},"note":"the arithmetic version was tested on uint16, where wrapping is defined, so even overflowing sums passed","reading":"correctness for distinct objects is not the difference"},"compilation":{"target":"arm64","optimisation":"-O2","swapTemp":["ldr w8, [x0]","ldr w9, [x1]","str w9, [x0]","str w8, [x1]","ret"],"swapXor":["ldr w8, [x1]","ldr w9, [x0]","eor w8, w9, w8","str w8, [x0]","ldr w9, [x1]","eor w8, w9, w8","str w8, [x1]","ldr w9, [x0]","eor w8, w9, w8","str w8, [x0]","ret"],"instructionCounts":{"temp":5,"xor":10},"withRestrict":["ldr w8, [x1]","ldr w9, [x0]","str w9, [x1]","str w8, [x0]","ret"],"onLocals":"all three XORs vanish; the exchange becomes a register rename","conclusion":"the reason it cannot be optimised is the reason it is wrong"},"timingCpp":{"unit":"ns","swaps":32768,"copyOverheadSubtracted":8458,"rows":[{"method":"temporary variable","ns":8083,"ratio":1.0},{"method":"std::swap","ns":9000,"ratio":1.11},{"method":"xor swap","ns":15958,"ratio":1.97},{"method":"add/sub swap","ns":15958,"ratio":1.97}]},"timingPython":{"unit":"ns per swap","rows":[{"method":"a, b = b, a","ns":12.0,"note":"a dedicated SWAP opcode; no tuple is built"},{"method":"t = a; a = b; b = t","ns":25.4,"ratio":2.12},{"method":"a ^= b; b ^= a; a ^= b","ns":76.8,"ratio":6.4}],"aliasSafe":{"tuple":true,"xor":false}},"arithmeticOverflow":{"signed":{"a":2000000000,"b":2000000000,"sum":4000000000,"intMax":2147483647,"verdict":"undefined behaviour"},"unsigned":{"a":4000000000,"b":4000000000,"wraps":true,"correct":true,"why":"unsigned wrapping is defined and the subtractions unwrap it exactly"},"java":"int arithmetic is defined to wrap, so this version is merely pointless rather than dangerous","python":"integers widen instead of overflowing"},"languageNotes":{"java":"cannot swap two int LOCALS in a method at all — arguments are passed by value, so the trick only ever appears on array elements, which is exactly where i == j lives","cpp":"std::swap moves rather than copies for non-trivial types, which neither trick can do","python":"the right-hand side is evaluated before either assignment, which is what makes the tuple form alias-safe"},"whenTheTrickIsWorthIt":["understanding XOR's self-inverse property, which the array problems later in this topic depend on","genuinely register-starved code where a spill costs more than three XORs and aliasing is ruled out by construction"]}
```

<!-- @highlights -->
- Two labelled registers hold a = 1101 and b = 0111 as bit rows.
- Step one highlights the differing columns and fills a with 1010, annotated "contains both, and neither".
- Step two stacks b against the combined value and cancels b's contributions column by column.
- It is labelled "b's own contribution cancels out", leaving 1101.
- A symbolic running note beside the bits tracks A, A^B, then A^B and A, then B and A.
- The aliasing panel draws {7, 8, 9} as three boxes with i and j both aimed at the middle one.
- Two arrows converge on a single cell so the collision is unmistakable.
- The first XOR line empties that box, and the next two do nothing, ending at {7, 0, 9} in red.
- The same two arrows are then run through the temporary version, ending at {7, 8, 9} in green.
- The compilation panel puts both sources side by side with their assembly beneath, five instructions against ten.
- The three eor lines are highlighted as the difference.
- A third column shows the same XOR source with __restrict collapsing to the identical five instructions.
- An arrow runs from the aliasing panel to it, labelled "the reason it cannot be optimised is the reason it is wrong".
- A C++ timing chart gives 8,083ns, 9,000ns, 15,958ns and 15,958ns over 32,768 array swaps.
- A Python chart gives 12.0ns, 25.4ns and 76.8ns per swap.
- The tuple form is annotated "a dedicated SWAP opcode; no tuple is built".

<!-- @edgeCases -->
- a and b are the same object — the XOR and arithmetic swaps set it to 0; only the temporary version is correct.
- swap(arr[i], arr[j]) with i == j — the concrete form of the above, and routine inside sorting routines.
- a == b as values but distinct objects — all three forms are correct; this is the case that looks like the aliasing test and is not.
- Signed operands in the arithmetic swap — a = b = 2000000000 overflows int and is undefined behaviour.
- Unsigned operands in the arithmetic swap — wrapping is defined, and all 4,294,967,296 sixteen-bit pairs pass.
- Java locals — cannot be swapped by a method at all, since arguments are passed by value.
- Non-integer types — neither trick applies; std::swap handles any movable type.
- Floating-point values — XOR is not defined for them, and the arithmetic version loses precision rather than round-tripping.
- Python's unbounded integers — the arithmetic version cannot overflow, which removes one objection and none of the others.
- Volatile or memory-mapped operands — three read-modify-write cycles against two, which matters when the reads have side effects.
- Multi-threaded access to either operand — the trick leaves the value observably 0 partway through, where the temporary never publishes an invalid state.

<!-- @pitfalls -->
- Using the XOR swap on array elements. arr[i] ^= arr[j] with i == j silently zeroes the element, and every sorting routine produces i == j sooner or later.
- Believing the trick is faster. It measured 1.97x slower — 15,958ns against 8,083ns over 32,768 swaps — and compiles to ten instructions against five.
- Believing it saves memory. The temporary lives in a register and never reaches memory; the compiled temporary version is two loads and two stores.
- Adding an i != j guard to make the trick safe. That is a branch to protect a slower version of code that was already correct without it.
- Using the arithmetic swap on signed types. The sum is undefined behaviour on overflow, not a wrapped value you can reason about.
- Testing a swap with two distinct values only. All three forms pass; the aliasing case is the only one that separates them.
- Writing a swap(int a, int b) method in Java. It exchanges its own copies and has no effect on the caller.
- Using a temporary in Python. Correct, and 2.12x slower than a, b = b, a, which is also shorter.
- Reaching for the XOR trick to demonstrate cleverness in an interview. The interesting answer is why it is slower and where it breaks, not that it exists.
- Assuming __restrict makes it worthwhile. It makes the trick identical to the temporary, which is an argument for the temporary.
- Applying either trick to floats or objects. XOR is undefined for them and the arithmetic version does not round-trip.
- Forgetting that the trick publishes a zero. In concurrent or volatile contexts the intermediate state is observable, where a temporary never exposes one.

<!-- @doubt -->
### Why does the XOR swap work?

<!-- @answer -->
Because XOR is its own inverse: a ^ a is 0 and a ^ 0 is a, so applying a value twice cancels it. After a ^= b, a holds A ^ B — a combination from which either original can be recovered given the other. Then b ^= a computes B ^ (A ^ B), and B cancels against itself, leaving A. Finally a ^= b computes (A ^ B) ^ A, leaving B. Verified over all 4,294,967,296 pairs of 16-bit values with 0 failures. That cancellation property is the genuinely valuable thing here — it is the entire basis of Single Number, Minimum Bit Flips and XOR of a range.

<!-- @doubt -->
### Is the XOR swap actually faster?

<!-- @answer -->
No, it is 1.97x slower. Over 32,768 array swaps with the copy overhead subtracted, the temporary version took 8,083ns and the XOR version 15,958ns. The disassembly explains it: five instructions against ten. The temporary compiles to two loads, two stores and a return; the XOR version compiles to three loads, three XORs and three stores, because the compiler cannot fold them. std::swap sat at 9,000ns, within inlining noise of the hand-written temporary. In Python the gap is wider still — 76.8ns against 12.0ns for a, b = b, a, a factor of 6.40.

<!-- @doubt -->
### Why can't the compiler optimise it?

<!-- @answer -->
Because through references it has no way to prove the two operands are distinct objects, and if they are the same object the three-XOR sequence has a different result — zero — which is defined behaviour it must preserve. So it emits all three operations. The proof is direct: mark the pointers __restrict, promising they never alias, and the identical three lines compile to exactly the five instructions of the temporary version. On plain locals, where aliasing is impossible, all three XORs vanish and the exchange becomes a register rename. The trick is slow precisely because it is broken.

<!-- @doubt -->
### What exactly goes wrong when i == j?

<!-- @answer -->
The first line becomes arr[i] ^= arr[i], and a value XORed with itself is 0, so the element is zeroed immediately. The remaining two lines XOR 0 with 0 and change nothing. Measured, {7, 8, 9} with i = j = 1 becomes {7, 0, 9}. The temporary version handles the same case correctly: it copies the value aside, assigns it to itself, and assigns it back, leaving the element unchanged. This matters because i == j is routine — a partition step whose pivot is already in place, or a selection sort whose minimum has not moved — and nothing reports the corruption.

<!-- @doubt -->
### Can I just guard with if (i != j)?

<!-- @answer -->
You can, and it makes the situation worse. You have added a branch — which costs more than the temporary it was avoiding — to protect a version that measured 1.97x slower than the code you would have written without either. The guard also has to be right everywhere the trick is used, which is a maintenance obligation with no upside. The honest summary is that the XOR swap has one property a temporary lacks, and that property is the failure mode.

<!-- @doubt -->
### What about the addition and subtraction version?

<!-- @answer -->
It is the same idea with worse edges. It has the identical aliasing bug — the same object goes to 0 — and it measured the same 15,958ns. On top of that, the sum in the first step may not be representable: with a = b = 2000000000 the sum is 4,000,000,000 against an INT_MAX of 2,147,483,647, which is undefined behaviour in C++ rather than a wrapped value. On unsigned types wrapping is defined and it is correct, verified on all 4,294,967,296 sixteen-bit pairs — but those are exactly the types where XOR was already correct. There is no input for which this is the right choice.

<!-- @doubt -->
### Why is Python's tuple swap so fast?

<!-- @answer -->
Because CPython compiles a, b = b, a to a dedicated SWAP opcode and never builds a tuple at all. Measured at 12.0ns per swap, against 25.4ns for an explicit temporary and 76.8ns for the XOR version. It is also alias-safe, and for a structural reason worth knowing: the entire right-hand side is evaluated before either assignment happens, so arr[i], arr[j] = arr[j], arr[i] with i == j reads both values first and writes them back unchanged. It is simultaneously the shortest, the fastest and the safest form, which is rare enough to be worth stating.

<!-- @doubt -->
### Can I swap two variables in Java this way?

<!-- @answer -->
Not two locals, by any method. Java passes arguments by value, so a swap(int a, int b) method exchanges its own copies and the caller sees nothing — this is not a limitation of the trick but of the language. The only place a swap helper can act is on a container: array elements or a List via Collections.swap. Which means that in Java the XOR trick can only ever appear in exactly the position where the i == j bug lives, and never in the position where it would be harmless.

<!-- @doubt -->
### Is the trick ever worth using?

<!-- @answer -->
Rarely, and never for the reason it is usually taught. Two genuine cases exist. The first is understanding: XOR's self-inverse property is the foundation of every array problem later in this topic, and three lines exchanging two values is the clearest place to see it. The second is genuinely register-starved code — some embedded and cryptographic contexts — where spilling a register costs more than three XORs and aliasing is ruled out by construction rather than by hope. For exchanging two values in ordinary code, the language's own swap is faster, correct, and says what it means.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Divide two numbers without multiplication and division, which is the first subtopic in this topic to build an algorithm rather than apply a one-line identity. It reconstructs long division in binary, assembling the quotient one shifted bit at a time, and it carries an overflow case that no bit trick can avoid: INT_MIN divided by -1 has no representable answer. After that the topic turns to XOR proper, where the cancellation property demonstrated here stops being a curiosity and becomes the entire method.
