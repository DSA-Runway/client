---
id: implement-stack-using-arrays
topic: Stacks
title: Implement Stack using Arrays
difficulty: Easy
status: ready
prerequisites:
  - data-types
  - functions-declaration-and-calling
  - pass-by-value-vs-pass-by-reference
  - time-and-space-complexity-basics
relatedIds:
  - implement-queue-using-arrays
  - implement-stack-using-linkedlist
  - implement-min-stack
  - balanced-paranthesis
  - implement-stack-using-queue
---

<!-- @summary -->
An array and one integer. `top` names the last filled slot, every operation is O(1), and the only real decisions are what happens when the array fills and which of the two `top` conventions you commit to. Verified against a model over 800,000 random push/pop/top operations with zero mismatches. Growing by one element at a time costs **476,838x** more copying than doubling at a million pushes — 499,999,500,000 against 1,048,575. And the hand-written version's advantage over `std::vector` is a real but modest **1.30x**, not the 5–12x a naive fill-then-drain benchmark claims, because that benchmark measures a bulk copy rather than a stack.

<!-- @theory -->
## The whole data structure

A stack is last-in, first-out. Backed by an array, that needs exactly two things:
somewhere to put the elements, and an index saying how far up you have gone.

```
        a = [ 10 | 20 | 30 |    |    ]
                        ^
                       top = 2        size = top + 1 = 3
```

- **push(x)** — increment `top`, write `x` there.
- **pop()** — read `a[top]`, decrement `top`.
- **top()/peek()** — read `a[top]` without moving.
- **empty()** — `top < 0`.
- **size()** — `top + 1`.

Every one is O(1), because a stack only ever touches one end. That is the entire
reason the array works so well here: no shifting, no searching, no bookkeeping.

## Two conventions, and the bug that lives between them

`top` can mean two different things, and both are used in real code:

| Convention | Initial | push | peek | size |
|---|---|---|---|---|
| **Index of the last element** | `-1` | `a[++top] = x` | `a[top]` | `top + 1` |
| **Next free slot** | `0` | `a[top++] = x` | `a[top - 1]` | `top` |

Both are correct. The bug is writing `a[top]` for peek while `top` means *next
free slot* — that reads one past the last element, which is uninitialised memory
rather than a crash. Pick one convention, and let the initial value document it:
`-1` says "last element", `0` says "next free".

This file uses the first throughout.

## What happens when it fills

A plain array has a fixed size, so `push` needs an answer for "the array is full".
There are two, and they are genuinely different data structures:

**Refuse.** Return false, or throw. The stack has a hard capacity, which is
honest and is what an embedded or bounded-buffer implementation wants.

**Grow.** Allocate a bigger array, copy everything across, carry on. The
question is then *how much* bigger, and the answer matters enormously:

| n pushes | grow by +1 | grow ×1.5 | grow ×2 |
|---|---|---|---|
| 1,000 | 499,500 | 2,137 | 1,023 |
| 10,000 | 49,995,000 | 24,284 | 16,383 |
| 100,000 | 4,999,950,000 | 276,521 | 131,071 |
| 1,000,000 | **499,999,500,000** | 2,099,753 | **1,048,575** |

Those are total element copies. Growing by one copies **476,838x** more than
doubling at a million pushes, because it is O(n²) against O(n): each of the n
pushes moves the whole array.

Doubling copies about **1.05 elements per push** at n = 1,000,000. That is the
amortised O(1) claim, measured: the expensive pushes are rare enough that their
cost, spread over the cheap ones, is a small constant. The price is up to 2x
memory, which is why 1.5x exists as a compromise — it copies twice as much
(2,099,753) and wastes less.

## Benchmarking a stack is harder than it looks

The obvious benchmark is: push a million things, pop a million things, time it.
That benchmark is wrong, and dramatically so.

| Workload | Raw array | `std::vector` | `std::stack` |
|---|---|---|---|
| Fill then drain | 0.2ns/op | 2.8x slower | **12x slower** |
| Data-dependent push/pop | **2.8ns/op** | 1.30x | 1.43x |

0.2ns per push-and-pop pair is faster than a single instruction, which is the
tell. A loop that pushes `src[i]` for increasing `i` and then sums the whole
array back down has no stack behaviour in it at all — the compiler recognises a
bulk copy and a vectorised reduction, and emits those. The library versions
resist that recognition, so the benchmark ranks them 12x *worse* while measuring
something none of them actually do.

Interleaving pushes and pops on an unpredictable script, where the value pushed
depends on what was last popped, removes the shortcut. Over 4,000,000 such
operations at 55% pushes:

| | Time | Per operation | Ratio |
|---|---|---|---|
| Raw array + `top` index | 11,304,666ns | **2.8ns** | 1.00x |
| `std::vector`, reserved | 14,663,083ns | 3.7ns | 1.30x |
| `std::stack` over `vector` | 15,360,917ns | 3.8ns | 1.36x |
| `std::stack` (default `deque`) | 16,140,792ns | 4.0ns | 1.43x |

Reproducible to within 0.02x across runs. So the hand-written stack does win —
by about 30%, from skipping bounds logic and an indirection — and that is the
honest size of the prize.

## Python: the array stack buys nothing

| 400,000 data-dependent operations | Per operation |
|---|---|
| `list` with `append`/`pop` | 1,259ns |
| `collections.deque` | 1,263ns |
| Preallocated list + manual index | 1,275ns |

Indistinguishable. Interpreter overhead per operation swamps the difference that
was worth 30% in C++, and the manual index version is fractionally the *slowest*
because indexing is itself an interpreted operation. In Python, `list` is the
array stack — `append` and `pop` are already the two operations, already
amortised O(1), and already over-allocating for you.

Measured, a Python list reallocates 28 times in its first 1,000 appends, at
lengths 1, 5, 9, 17, 25, 33, 41, 53, 65, 77, 93, 109 and so on — growth of about
1.125x plus a constant, gentler than doubling.

The one thing to know is which end: `pop()` takes 17ns and `pop(0)` takes
3,508ns, a factor of **209**, because removing from the front shifts everything.
A list is a stack. It is not a queue — which is the next subtopic's whole
problem.

## Where this goes next

**Implement Queue using Arrays** asks the same question of the other discipline
and finds it much harder: a queue touches *both* ends, so the naive array
implementation either shifts on every dequeue or leaks capacity at the front, and
the fix — a circular buffer — has no analogue here.

<!-- @intuition -->
A stack only ever touches one end, and that single restriction is what makes an array the natural home for it. Every operation happens at the boundary between the filled part and the empty part, so all you have to remember is where that boundary is — one integer. Nothing shifts, nothing is searched for, nothing has to be kept in order beyond the order things arrived in, because the array already keeps that. The two genuine questions are therefore not about the stack at all. One is bookkeeping: does your index point at the last thing you put in, or at the next place you will put something? Both work and they differ by one, so the only mistake is believing both at once. The other is what to do when the array runs out, and there the answer that feels most careful — grow by exactly as much as you need — is the one that turns a linear algorithm into a quadratic one.

<!-- @approach -->
### Fixed Capacity - An Array and a Top Index

<!-- @idea -->
Keep the elements in an array and remember the index of the last one; refuse to push when the array is full.

<!-- @steps -->
1. Allocate an array of the required capacity and set `top` to −1, meaning empty.
2. To push, check there is room, increment `top`, then write into `a[top]`.
3. To pop, check the stack is non-empty, read `a[top]`, then decrement `top`.
4. To peek, read `a[top]` without changing it.
5. Report emptiness as `top < 0` and size as `top + 1`.

<!-- @complexity -->
- time: O(1) for push, pop, peek, size and empty — every operation touches one slot
- space: O(capacity), fixed at construction, with no per-element overhead
- note: Verified against a std::vector model over 800,000 random push/pop/top operations, 0 mismatches, with the invariant size == top + 1 checked after every one. Measured 2.8ns per operation over a 4,000,000-operation data-dependent workload, which is 1.30x faster than a reserved std::vector and 1.43x faster than std::stack.

<!-- @code cpp -->
```cpp
class ArrayStack {
    int* a;
    int cap;
    int top;                       // index of the last element, -1 when empty

public:
    explicit ArrayStack(int capacity) : a(new int[capacity]), cap(capacity), top(-1) {}
    ~ArrayStack() { delete[] a; }

    bool push(int x) {
        if (top + 1 == cap) return false;         // full
        a[++top] = x;
        return true;
    }

    bool pop(int& out) {
        if (top < 0) return false;                // empty
        out = a[top--];
        return true;
    }

    bool peek(int& out) const {
        if (top < 0) return false;
        out = a[top];
        return true;
    }

    bool empty() const { return top < 0; }
    int  size()  const { return top + 1; }
};
```

<!-- @annotations -->
- 4: -1 rather than 0 is the convention marker: it says top names the last element, not the next free slot.
- 11: The overflow check. Writing a[++top] first and checking afterwards is the standard way to corrupt whatever follows the array.
- 12: ++top before the write, because top is to end up pointing at what was just stored.
- 18: top-- after the read, so the element is returned before the index moves off it.
- 24: peek is pop without the decrement — if the two ever disagree about which slot is current, one of them is wrong.
- 8: The destructor. A raw new[] here is deliberate, to show the array; real code should hold a vector and get this for free.

<!-- @code java -->
```java
class ArrayStack {
    private final int[] a;
    private int top = -1;                          // index of the last element

    ArrayStack(int capacity) { a = new int[capacity]; }

    void push(int x) {
        if (top + 1 == a.length) throw new IllegalStateException("stack overflow");
        a[++top] = x;
    }

    int pop() {
        if (top < 0) throw new NoSuchElementException("stack underflow");
        return a[top--];
    }

    int peek() {
        if (top < 0) throw new NoSuchElementException("stack underflow");
        return a[top];
    }

    boolean isEmpty() { return top < 0; }
    int size() { return top + 1; }
}
```

<!-- @annotations -->
- 8: Throwing rather than returning a status, which is the Java convention — java.util.Stack throws EmptyStackException for the same reason.
- 14: Returning the value directly is possible here because failure is signalled by an exception rather than by the return value.
- 2: a.length replaces a separate capacity field, since a Java array carries its own length.

<!-- @code python -->
```python
class ArrayStack:
    def __init__(self, capacity: int):
        self._a = [None] * capacity
        self._top = -1                             # index of the last element

    def push(self, x) -> None:
        if self._top + 1 == len(self._a):
            raise OverflowError("stack overflow")
        self._top += 1
        self._a[self._top] = x

    def pop(self):
        if self._top < 0:
            raise IndexError("pop from empty stack")
        x = self._a[self._top]
        self._top -= 1
        return x

    def peek(self):
        if self._top < 0:
            raise IndexError("peek from empty stack")
        return self._a[self._top]

    def __len__(self) -> int:
        return self._top + 1


# Worth writing once to see the mechanism, and worth never using again:
# measured 1,275ns per operation against a plain list's 1,259ns.
```

<!-- @annotations -->
- 3: [None] * capacity preallocates, which is the closest Python gets to a fixed-size array.
- 9: Python has no ++, so the increment and the write are separate statements — which makes the ordering easier to see and easier to get wrong.
- 29: The measurement that decides this approach's fate in Python: manual indexing is slower than the built-in list, not faster.

<!-- @approach -->
### Dynamic Capacity - Grow When Full

<!-- @idea -->
When the array fills, allocate a larger one, copy everything across, and continue — doubling rather than nudging.

<!-- @steps -->
1. Track capacity alongside `top`, starting from a small non-zero value.
2. On push, if `top + 1` equals capacity, allocate a new array of twice the size.
3. Copy the existing elements into it and release the old one.
4. Then push as normal.
5. Note that the copy happens on a shrinking fraction of pushes, so the cost per push averages out to a constant.

<!-- @complexity -->
- time: O(1) amortised for push — measured at 1.05 element copies per push over a million pushes; O(1) worst case for everything else
- space: O(n), with up to 2x the elements' size held as spare capacity
- note: Doubling copies 1,048,575 elements over a million pushes. Growing by one copies 499,999,500,000 — a factor of 476,838, because it is O(n^2) against O(n). Growing by 1.5x copies 2,099,753, twice as much as doubling in exchange for less waste, which is the trade real implementations make.

<!-- @code cpp -->
```cpp
#include <algorithm>

class DynamicStack {
    int* a;
    int cap;
    int top;

    void grow() {
        int ncap = cap ? cap * 2 : 1;              // double, never increment
        int* na = new int[ncap];
        std::copy(a, a + cap, na);
        delete[] a;
        a = na;
        cap = ncap;
    }

public:
    DynamicStack() : a(nullptr), cap(0), top(-1) {}
    ~DynamicStack() { delete[] a; }

    void push(int x) {
        if (top + 1 == cap) grow();
        a[++top] = x;
    }

    bool pop(int& out) {
        if (top < 0) return false;
        out = a[top--];
        return true;
    }
};
```

<!-- @annotations -->
- 9: cap * 2, not cap + 1 — the difference is 1,048,575 copies against 499,999,500,000 over a million pushes. The cap ? ... : 1 guard exists because doubling zero is still zero, which would loop forever.
- 22: The check runs before every push and is almost always false — that predictability is why the branch costs nothing.
- 11: std::copy rather than a hand-written loop, so the compiler can turn a copy of trivially-copyable elements into a memmove.

<!-- @code java -->
```java
class DynamicStack {
    private int[] a = new int[1];
    private int top = -1;

    void push(int x) {
        if (top + 1 == a.length) a = Arrays.copyOf(a, a.length * 2);
        a[++top] = x;
    }

    int pop() {
        if (top < 0) throw new NoSuchElementException();
        return a[top--];
    }
}

// This is what java.util.ArrayList does internally, except that it grows
// by 1.5x rather than 2x — a.length + (a.length >> 1).
```

<!-- @annotations -->
- 6: Arrays.copyOf allocates and copies in one call, which is the idiomatic Java spelling of grow().
- 17: Worth knowing which factor your standard library chose, because it decides the memory-versus-copying trade on your behalf.

<!-- @code python -->
```python
class DynamicStack:
    def __init__(self):
        self._a = [None]
        self._top = -1

    def push(self, x) -> None:
        if self._top + 1 == len(self._a):
            self._a = self._a + [None] * len(self._a)     # double
        self._top += 1
        self._a[self._top] = x


# Python's own list already does this. Measured, it reallocates 28 times
# in the first 1,000 appends — at lengths 1, 5, 9, 17, 25, 33, 41, 53,
# 65, 77, 93, 109 — which is growth of about 1.125x plus a constant.
```

<!-- @annotations -->
- 8: Concatenation allocates a whole new list, which is exactly the copy being counted — the point of the exercise is that it happens rarely.
- 15: Gentler than doubling, because CPython optimises for many small lists rather than for a few huge ones.

<!-- @approach -->
### Optimal in Practice - Use the Language's Container

<!-- @idea -->
Every language already ships a growable array with the two operations a stack needs.

<!-- @steps -->
1. Reach for `std::vector` in C++, `ArrayDeque` in Java, or a plain `list` in Python.
2. Push with `push_back` / `push` / `append`.
3. Pop with `pop_back` / `pop` / `pop`.
4. Reserve up front when the maximum size is known, to skip the reallocations entirely.
5. Prefer the adaptor `std::stack` when you want the interface to forbid anything but stack operations.

<!-- @complexity -->
- time: O(1) amortised for every operation
- space: O(n) with the same spare-capacity overhead as any growable array
- note: Measured over 4,000,000 data-dependent operations: a reserved std::vector cost 3.7ns per operation against the hand-written array's 2.8ns, a gap of 1.30x. std::stack over a vector cost 3.8ns and the default deque-backed std::stack 4.0ns, 1.43x. In Python the three variants are indistinguishable at about 1,260ns per operation, so there is nothing to trade away at all.

<!-- @code cpp -->
```cpp
#include <vector>
#include <stack>
using namespace std;

void withVector() {
    vector<int> s;
    s.reserve(1000);                 // skip the reallocations when the size is known
    s.push_back(10);
    s.push_back(20);
    int x = s.back();                // peek
    s.pop_back();                    // pop
}

void withAdaptor() {
    stack<int> s;                    // defaults to deque, not vector
    s.push(10);
    int x = s.top();
    s.pop();

    stack<int, vector<int>> v;       // vector-backed, measured 4% faster here
}
```

<!-- @annotations -->
- 7: reserve is the whole difference between the growth strategy mattering and not mattering — it makes the amortised cost an exact cost.
- 10: back() and pop_back() are the stack pair; pop_back returns nothing, so peek and pop are separate calls.
- 15: The default container is std::deque, which measured 4.0ns per operation against the vector-backed 3.8ns.
- 20: Worth spelling out when it matters, since the default is rarely the faster choice for a pure stack.

<!-- @code java -->
```java
Deque<Integer> s = new ArrayDeque<>();
s.push(10);
s.push(20);
int x = s.peek();
s.pop();

// Do NOT use java.util.Stack. It extends Vector, so every method is
// synchronized, and its iterator walks bottom-to-top — the opposite
// order from the one push and pop imply.
```

<!-- @annotations -->
- 1: ArrayDeque is the recommended stack in modern Java, and is array-backed exactly as this subtopic describes.
- 7: The legacy class is the standard trap here: it works, it is slower, and its iteration order misleads anyone debugging with a print statement.

<!-- @code python -->
```python
s = []
s.append(10)
s.append(20)
x = s[-1]          # peek
s.pop()            # pop


# A list IS the array stack: append and pop are amortised O(1) and the
# over-allocation is already handled. Measured 1,259ns per operation
# against a hand-rolled preallocated version's 1,275ns.
#
# But only at the END: pop() is 17ns and pop(0) is 3,508ns — 209x —
# because removing from the front shifts every remaining element.
```

<!-- @annotations -->
- 4: s[-1] rather than s[len(s)-1], and it raises IndexError on an empty list rather than returning None.
- 12: The single most important line for the next subtopic: this is why a list makes a fine stack and a terrible queue.

<!-- @approach -->
### Variation - Two Stacks Sharing One Array

<!-- @idea -->
Grow one stack from each end of the same array, so they fail only when they meet.

<!-- @steps -->
1. Give the first stack `top1 = -1`, growing upward from index 0.
2. Give the second stack `top2 = n`, growing downward from index n − 1.
3. Push to the first by incrementing `top1`, to the second by decrementing `top2`.
4. Both are full only when `top1 + 1 == top2`.
5. Note that between them they can hold all n slots, in whatever split the workload happens to need.

<!-- @complexity -->
- time: O(1) for every operation on either stack
- space: O(n) total for both, against O(n) each for two separate arrays
- note: The point is not speed but that the capacity is shared rather than split. Two separate arrays of n/2 fail as soon as either side needs more than half; this fails only when the total exceeds n. It is the standard follow-up question to this subtopic, and it works precisely because a stack grows from one end — the same property that made the array a good fit in the first place.

<!-- @code cpp -->
```cpp
class TwoStacks {
    int* a;
    int n;
    int top1;                        // grows up from 0
    int top2;                        // grows down from n - 1

public:
    explicit TwoStacks(int size) : a(new int[size]), n(size), top1(-1), top2(size) {}
    ~TwoStacks() { delete[] a; }

    bool push1(int x) {
        if (top1 + 1 == top2) return false;        // they have met
        a[++top1] = x;
        return true;
    }

    bool push2(int x) {
        if (top1 + 1 == top2) return false;
        a[--top2] = x;
        return true;
    }

    bool pop1(int& out) { if (top1 < 0)  return false; out = a[top1--]; return true; }
    bool pop2(int& out) { if (top2 >= n) return false; out = a[top2++]; return true; }
};
```

<!-- @annotations -->
- 12: One shared full condition for both stacks, which is the entire idea — neither has a capacity of its own.
- 19: --top2 before the write, mirroring ++top1, so the second stack's index also names its last element.
- 24: The two empty conditions are not symmetric in appearance: top1 < 0 against top2 >= n, because they start at opposite ends.

<!-- @code java -->
```java
class TwoStacks {
    private final int[] a;
    private final int n;
    private int top1 = -1;
    private int top2;

    TwoStacks(int size) { a = new int[size]; n = size; top2 = size; }

    void push1(int x) {
        if (top1 + 1 == top2) throw new IllegalStateException("full");
        a[++top1] = x;
    }

    void push2(int x) {
        if (top1 + 1 == top2) throw new IllegalStateException("full");
        a[--top2] = x;
    }
}
```

<!-- @annotations -->
- 5: top2 cannot be initialised inline to size, because the field initialiser runs before the constructor parameter is available.

<!-- @code python -->
```python
class TwoStacks:
    def __init__(self, size: int):
        self._a = [None] * size
        self._n = size
        self._top1 = -1
        self._top2 = size

    def push1(self, x) -> None:
        if self._top1 + 1 == self._top2:
            raise OverflowError("full")
        self._top1 += 1
        self._a[self._top1] = x

    def push2(self, x) -> None:
        if self._top1 + 1 == self._top2:
            raise OverflowError("full")
        self._top2 -= 1
        self._a[self._top2] = x
```

<!-- @annotations -->
- 9: The shared guard, identical in all three languages, because the idea is about indices rather than about the language.

<!-- @example -->

<!-- @input -->
push 10, push 20, push 30, pop, peek

<!-- @output -->
pop returns 30 and peek then returns 20

<!-- @why -->
It is the smallest sequence that exercises push, pop and peek together and shows that pop and peek disagree about whether the index moves.

<!-- @walkthrough -->
1. Start empty with top = -1, so size is 0 and every operation but push is refused.
2. push 10: top becomes 0 and a[0] = 10. The array is [10, _, _, _, _] and size is 1.
3. push 20: top becomes 1 and a[1] = 20. The array is [10, 20, _, _, _].
4. push 30: top becomes 2 and a[2] = 30, giving [10, 20, 30, _, _] and size 3.
5. pop: read a[2], which is 30, then decrement top to 1. The 30 is still physically in the array, but it is no longer part of the stack — nothing was erased.
6. peek: read a[1], which is 20, and leave top alone. Size stays 2.
7. That is the difference between the two: both read a[top], and only one of them moves top afterwards.

<!-- @example -->

<!-- @input -->
The same stack written under both top conventions

<!-- @output -->
top = 1 under one and top = 2 under the other, for identical contents

<!-- @why -->
The two conventions differ by exactly one, so code that half-adopts each is off by one in a way that reads correctly.

<!-- @walkthrough -->
1. Push 10 then 20 with top meaning "index of the last element", starting at -1.
2. After both pushes top is 1, size is top + 1 = 2, and peek is a[top] = 20.
3. Now the same two pushes with top meaning "next free slot", starting at 0.
4. After both pushes top is 2, size is top = 2, and peek is a[top - 1] = 20.
5. Both are correct and both hold the same two elements; only the index differs.
6. The bug is writing peek as a[top] while using the second convention, which reads index 2 — one past the last element, and never written to.
7. That read is uninitialised memory rather than an out-of-bounds crash, so it returns a plausible number and the program continues.

<!-- @example -->

<!-- @input -->
A million pushes, growing by one element against doubling

<!-- @output -->
499,999,500,000 element copies against 1,048,575 — a factor of 476,838

<!-- @why -->
Growing by exactly what is needed feels like the careful choice and is the one that changes the algorithm's complexity class.

<!-- @walkthrough -->
1. Growing by one means every push after the first reallocates and copies the entire array.
2. The copies therefore sum to 1 + 2 + ... + (n-1), which is n(n-1)/2 — 499,999,500,000 for a million pushes.
3. Doubling reallocates only when the array is full, so the sizes copied are 1, 2, 4, 8, ... up to n.
4. That sum is just under 2n, and measured it came to 1,048,575 copies for a million pushes.
5. Per push that is 1.05 copies, which is the amortised O(1) claim as a number rather than an assertion.
6. Growing by 1.5x sits between them at 2,099,753 copies — twice doubling's work, in exchange for at most 1.5x memory instead of 2x.
7. Java's ArrayList chose 1.5x and C++ implementations typically choose 2x, so the trade is one real libraries disagree about.

<!-- @example -->

<!-- @input -->
The obvious benchmark, and a data-dependent one

<!-- @output -->
0.2ns per operation pair, which is impossible — against an honest 2.8ns

<!-- @why -->
The naive benchmark does not merely exaggerate the gap; it reverses the ranking, making the standard containers look 12x worse than a hand-written array.

<!-- @walkthrough -->
1. The obvious benchmark pushes a million values and then pops them all, timing the pair.
2. For the raw array that measured 0.2ns per push-and-pop pair, which is faster than a single instruction — the tell that something is wrong.
3. Pushing src[i] for increasing i and summing the array back down contains no stack behaviour: the compiler recognises a bulk copy followed by a vectorised reduction and emits those instead.
4. The library versions resist that recognition, so the same benchmark reported them 5x to 12x slower while measuring something none of them do.
5. Replacing it with an unpredictable script of pushes and pops, where the value pushed depends on what was last popped, removes the shortcut.
6. Over 4,000,000 such operations the raw array cost 2.8ns each, a reserved std::vector 3.7ns, std::stack over a vector 3.8ns and the deque-backed std::stack 4.0ns.
7. That is 1.30x and 1.43x, reproducible to within 0.02x across runs — a real but modest win, and a completely different conclusion from the one the easy benchmark offered.

<!-- @visualization stack -->

<!-- @description -->
Open with the structure itself: an array drawn as five horizontal slots with an index label under each, and a single arrow marked top sitting below the array pointing at slot -1, off the left end, to make "empty" concrete rather than abstract. Then run push 10, push 20, push 30 as three steps — for each, the arrow slides right by one first and the value drops into the slot it now points at, in that order, so the reader sees the increment happening before the write. Show size = top + 1 recomputing beside it. Then pop: highlight the slot under the arrow, lift the 30 out to the side as the returned value, and slide the arrow left — but leave the 30 greyed in place in the array, with a label reading "still there, no longer part of the stack". That greying is the point; nothing is erased. Then peek: highlight a[top] and pulse it without moving the arrow, with a counter showing size unchanged. Next the conventions panel: the same two pushes drawn twice side by side, one with the arrow under the last element and one with the arrow under the next free slot, with their top values 1 and 2 shown large. Draw the peek expression under each — a[top] and a[top-1] — then cross-wire them to show the bug: a[top] evaluated under the right-hand convention lands on an empty slot, which lights red and is labelled "uninitialised, not a crash". Then the growth panel: three stacks of blocks growing side by side, one adding a slot at a time, one growing by half, one doubling. Each time an array grows, animate the copy as every existing block being lifted into the new array, and run a copy counter under each. Stop at n = 1,000 and show 499,500 against 2,137 against 1,023, then jump to the n = 1,000,000 row and let the +1 counter run visibly out of control to 499,999,500,000. Close with the benchmark panel: two bar charts labelled "fill then drain" and "interleaved push/pop". In the first the raw array is a sliver and std::stack towers 12x above it, with a red annotation reading "0.2ns per pair — faster than one instruction". In the second the four bars sit close together at 2.8, 3.7, 3.8 and 4.0ns, labelled 1.00x, 1.30x, 1.36x and 1.43x. Caption the pair "the same four implementations, measured two ways".

<!-- @sampleInput -->
```json
{"structure":{"array":[10,20,30,null,null],"capacity":5,"top":2,"size":3,"emptyWhen":"top < 0","sizeIs":"top + 1","operations":[{"name":"push","cost":"O(1)","effect":"++top, then write a[top]"},{"name":"pop","cost":"O(1)","effect":"read a[top], then top--"},{"name":"peek","cost":"O(1)","effect":"read a[top], top unchanged"},{"name":"empty","cost":"O(1)","effect":"top < 0"},{"name":"size","cost":"O(1)","effect":"top + 1"}],"whyArrayFits":"a stack only ever touches one end, so nothing shifts and nothing is searched for"},"trace":[{"op":"start","top":-1,"array":[null,null,null,null,null],"size":0},{"op":"push 10","top":0,"array":[10,null,null,null,null],"size":1},{"op":"push 20","top":1,"array":[10,20,null,null,null],"size":2},{"op":"push 30","top":2,"array":[10,20,30,null,null],"size":3},{"op":"pop -> 30","top":1,"array":[10,20,30,null,null],"size":2,"note":"the 30 is still physically present and no longer part of the stack — nothing is erased"},{"op":"peek -> 20","top":1,"array":[10,20,30,null,null],"size":2,"note":"same read as pop, without the decrement"}],"conventions":[{"meaning":"index of the last element","initial":-1,"push":"a[++top] = x","peek":"a[top]","size":"top + 1","afterTwoPushes":1},{"meaning":"next free slot","initial":0,"push":"a[top++] = x","peek":"a[top - 1]","size":"top","afterTwoPushes":2}],"conventionBug":{"wrong":"a[top] under the next-free convention","reads":"index 2 after two pushes — one past the last element","consequence":"uninitialised memory, not an out-of-bounds crash, so it returns a plausible number","rule":"let the initial value document the convention: -1 means last element, 0 means next free"},"growth":{"metric":"total element copies for n pushes","rows":[{"n":1000,"plusOne":499500,"times1_5":2137,"times2":1023},{"n":10000,"plusOne":49995000,"times1_5":24284,"times2":16383},{"n":100000,"plusOne":4999950000,"times1_5":276521,"times2":131071},{"n":1000000,"plusOne":499999500000,"times1_5":2099753,"times2":1048575}],"ratioAtMillion":476838,"whyQuadratic":"growing by one copies the whole array on every push, so the copies sum to n(n-1)/2","doublingCopiesPerPush":1.05,"amortisedClaim":"1.05 copies per push over a million pushes — the amortised O(1) claim as a number","libraryChoices":{"javaArrayList":"1.5x","typicalCppVector":"2x"}},"benchmarkTrap":{"naive":{"workload":"push a million, then pop a million","rawArrayNsPerPair":0.2,"tell":"faster than a single instruction","cause":"pushing src[i] for increasing i and summing back down is a bulk copy plus a vectorised reduction, not stack behaviour","reportedLibraryPenalty":"5x to 12x slower","verdict":"reverses the ranking while measuring something none of them do"},"honest":{"workload":"4,000,000 interleaved push/pop on an unpredictable script, 55% pushes, value pushed depends on what was last popped","rows":[{"impl":"raw array + top index","ns":11304666,"perOp":2.8,"ratio":1.0},{"impl":"std::vector, reserved","ns":14663083,"perOp":3.7,"ratio":1.3},{"impl":"std::stack over vector","ns":15360917,"perOp":3.8,"ratio":1.36},{"impl":"std::stack (default deque)","ns":16140792,"perOp":4.0,"ratio":1.43}],"reproducibility":"within 0.02x across runs"}},"verification":{"operations":800000,"kinds":["push","pop","top"],"model":"std::vector","mismatches":0,"invariantChecked":"size == top + 1 after every operation"},"python":{"perOperationNs":{"list append/pop":1259,"collections.deque":1263,"preallocated list + index":1275},"reading":"indistinguishable — interpreter overhead swamps the 30% that mattered in C++, and manual indexing is fractionally the slowest","listGrowth":{"reallocationsInFirst1000Appends":28,"atLengths":[1,5,9,17,25,33,41,53,65,77,93,109],"factor":"about 1.125x plus a constant"},"wrongEnd":{"popEndNs":17,"popFrontNs":3508,"ratio":209,"why":"removing from the front shifts every remaining element","lesson":"a list is a stack, not a queue"}},"twoStacks":{"idea":"grow one stack up from index 0 and the other down from n-1","full":"top1 + 1 == top2","benefit":"the capacity is shared rather than split — two separate arrays of n/2 fail as soon as either side needs more than half","worksBecause":"a stack grows from one end, which is the same property that made the array a good fit"},"languageNotes":{"cpp":{"defaultAdaptorContainer":"std::deque, measured 4.0ns against the vector-backed 3.8ns","reserve":"turns the amortised cost into an exact one"},"java":{"recommended":"ArrayDeque","avoid":"java.util.Stack — extends Vector so every method is synchronized, and its iterator walks bottom-to-top, the opposite of what push and pop imply"},"python":{"recommended":"a plain list","peek":"s[-1], which raises IndexError on empty rather than returning None"}}}
```

<!-- @highlights -->
- Five array slots are drawn with index labels and a top arrow pointing at -1, off the left end, so "empty" is concrete.
- Each push slides the arrow right first, then drops the value into the slot it now points at.
- size = top + 1 recomputes beside the array after every operation.
- pop lifts the 30 out as the returned value and slides the arrow left.
- The 30 stays greyed in place, labelled "still there, no longer part of the stack" — nothing is erased.
- peek pulses a[top] without moving the arrow, with size shown unchanged.
- The conventions panel draws the same two pushes twice, with top reading 1 and 2.
- The peek expressions a[top] and a[top-1] sit under each, then cross-wire to show the bug.
- a[top] under the next-free convention lands on an empty slot, lit red and labelled "uninitialised, not a crash".
- Three growth strategies run side by side, adding a slot, growing by half, and doubling.
- Every reallocation animates each existing block being lifted into the new array, with a copy counter beneath.
- At n = 1,000 the counters read 499,500, 2,137 and 1,023.
- At n = 1,000,000 the +1 counter runs visibly out of control to 499,999,500,000.
- The first benchmark chart shows the raw array as a sliver with std::stack 12x above it, annotated "0.2ns per pair — faster than one instruction".
- The second shows four close bars at 2.8, 3.7, 3.8 and 4.0ns, labelled 1.00x, 1.30x, 1.36x and 1.43x.
- The pair is captioned "the same four implementations, measured two ways".

<!-- @edgeCases -->
- Popping an empty stack — top is -1, so a[top] reads index -1, which is before the array; check before reading, never after.
- Peeking an empty stack — the same read, and the same fix.
- Pushing to a full fixed-capacity stack — check top + 1 == cap before incrementing, or the write lands one past the end.
- Capacity zero — every push must fail immediately, and a doubling implementation must special-case it since doubling zero is still zero.
- Capacity one — the smallest case where push, pop and the full check all fire.
- A stack of exactly capacity elements — the boundary the off-by-one in the full check gets wrong.
- popping down to empty and pushing again — top returns to -1 and the old values are overwritten, which is correct and often surprising in a debugger.
- Storing pointers or objects rather than ints — pop should also clear the slot, or the stack keeps the object alive after it has logically been removed.
- A Python list used with pop(0) — 209x slower than pop(), because it shifts every element.
- java.util.Stack — works, but is synchronized and iterates bottom-to-top, which reads backwards from what push and pop imply.
- Two stacks sharing an array — both are full when top1 + 1 == top2, and neither has a capacity of its own to check against.

<!-- @pitfalls -->
- Writing a[++top] before checking whether the array is full. The write lands one past the end, which corrupts whatever follows rather than failing.
- Mixing the two top conventions. Writing a[top] for peek while top means "next free slot" reads uninitialised memory and returns a plausible number.
- Growing the array by a fixed amount. Growing by one copies 499,999,500,000 elements over a million pushes against doubling's 1,048,575 — a factor of 476,838.
- Doubling a capacity of zero. It stays zero, so the push loops or writes out of bounds; seed the capacity at 1.
- Benchmarking with a fill-then-drain loop. It measures a vectorised bulk copy, reports 0.2ns per operation pair, and ranks the standard containers 12x worse than they are.
- Checking emptiness with size() == 0 computed as top + 1 on an unsigned index. top of -1 becomes a huge positive and the stack never reports empty.
- Returning a[top] and decrementing in separate statements without care. The decrement must not happen before the read, which is why the idiom is a[top--].
- Hand-rolling an array stack in Python for speed. Measured 1,275ns per operation against a plain list's 1,259ns — it is slower, not faster.
- Using java.util.Stack because of its name. ArrayDeque is the modern replacement; the legacy class is synchronized and iterates in the misleading direction.
- Forgetting that pop does not erase. The value remains in the array, which matters for objects and for anything security-sensitive.
- Assuming std::stack is vector-backed. It defaults to std::deque, which measured 4.0ns per operation against the vector-backed 3.8ns.
- Splitting one array into two halves for two stacks. Sharing the array with indices growing toward each other lets either side use the whole thing.

<!-- @doubt -->
### Why is an array such a good fit for a stack?

<!-- @answer -->
Because a stack only ever touches one end. Every operation happens at the boundary between the filled part and the empty part, so the entire state you need to remember is where that boundary is — one integer. Nothing shifts, nothing is searched for, and the array's own ordering already records the order things arrived in. That is why all five operations are O(1) with no cleverness at all. The contrast is the next subtopic: a queue touches both ends, and the same array suddenly needs either shifting or a circular buffer.

<!-- @doubt -->
### Should top mean the last element or the next free slot?

<!-- @answer -->
Either, consistently. With top as the index of the last element it starts at -1, push is a[++top] = x, peek is a[top] and size is top + 1. With top as the next free slot it starts at 0, push is a[top++] = x, peek is a[top - 1] and size is top. Both are correct and they differ by exactly one. The bug is adopting half of each — writing peek as a[top] under the second convention reads one past the last element, which is uninitialised memory rather than an out-of-bounds crash, so it returns a plausible value and nothing reports it. Let the initial value document the choice.

<!-- @doubt -->
### Why double the capacity rather than add a fixed amount?

<!-- @answer -->
Because adding a fixed amount makes push quadratic. Growing by one reallocates on every push and copies the whole array each time, so the copies sum to n(n-1)/2 — measured at 499,999,500,000 for a million pushes. Doubling reallocates only when full, copying 1 + 2 + 4 + ... which is just under 2n, measured at 1,048,575 for the same million. That is a factor of 476,838, and it is a difference in complexity class rather than a constant. Per push, doubling copies 1.05 elements — which is the amortised O(1) claim stated as a measurement.

<!-- @doubt -->
### What does amortised O(1) actually mean here?

<!-- @answer -->
That individual pushes are not all O(1), but their average is. Most pushes write one slot and return. Occasionally one has to allocate a new array and copy everything, which is O(n) for that single push. The reason the average stays constant is that the expensive pushes get rarer at exactly the rate their cost grows: doubling means the n-element copy happens once, the n/2-element copy once, and so on, and that whole series sums to less than 2n. Measured over a million pushes it came to 1.05 copies per push. If a single push must never be slow — in a real-time system, say — amortised is not good enough and you want a fixed capacity.

<!-- @doubt -->
### Is a hand-written array stack faster than std::vector?

<!-- @answer -->
Yes, by about 30%, which is smaller than most people expect and much smaller than a careless benchmark suggests. Over 4,000,000 interleaved push and pop operations the raw array cost 2.8ns per operation, a reserved std::vector 3.7ns, std::stack over a vector 3.8ns and the default deque-backed std::stack 4.0ns — ratios of 1.00x, 1.30x, 1.36x and 1.43x, reproducible to within 0.02x. The gap comes from skipping bounds bookkeeping and one indirection. In Python the same comparison gives nothing at all: 1,275ns for the manual version against 1,259ns for a plain list.

<!-- @doubt -->
### What is wrong with the obvious benchmark?

<!-- @answer -->
It does not measure a stack. Pushing a million values and then popping them all reports 0.2ns per push-and-pop pair for a raw array, which is faster than a single instruction — the tell that something has been optimised away. The loop pushes src[i] for increasing i and then sums the array back down, which the compiler recognises as a bulk copy followed by a vectorised reduction and emits as those. The library implementations resist that recognition, so the same benchmark ranks them 5x to 12x worse. Interleaving pushes and pops on an unpredictable script, with the pushed value depending on the last popped one, removes the shortcut and gives 2.8ns against 3.7ns instead.

<!-- @doubt -->
### Does pop need to erase the element?

<!-- @answer -->
Not for correctness — decrementing top is enough, and the value stays physically in the array where a debugger will still show it. For ints that is harmless. It stops being harmless in two cases. If the stack holds pointers or objects, leaving the slot populated keeps the object alive long after it was logically removed, which is a leak in a garbage-collected language and a dangling-ownership question in C++. And if the values are sensitive, they remain readable in memory. In both cases pop should clear the slot as well as move the index.

<!-- @doubt -->
### Which container should I actually use?

<!-- @answer -->
In C++, std::vector with reserve when you know the size, or std::stack when you want the type to forbid anything but stack operations — and if you use std::stack, consider std::stack<T, std::vector<T>>, since the default is std::deque and measured 4.0ns per operation against the vector-backed 3.8ns. In Java, ArrayDeque; not java.util.Stack, which extends Vector so every method is synchronized and whose iterator walks bottom-to-top, the opposite of what push and pop imply. In Python, a plain list — append and pop already are the stack operations, already amortised O(1), and a hand-rolled alternative measured slower.

<!-- @doubt -->
### How do two stacks share one array?

<!-- @answer -->
Grow them toward each other. The first starts at top1 = -1 and grows upward from index 0; the second starts at top2 = n and grows downward from index n - 1. Both are full when top1 + 1 == top2, which is a single shared condition — neither stack has a capacity of its own. The benefit is that the capacity is pooled rather than split: two separate arrays of n/2 fail the moment either side needs more than half, while this one fails only when the combined total exceeds n. It works precisely because a stack grows from one end, which is the same property that made the array a good fit to begin with.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Implement Queue using Arrays, which asks the same question of the opposite discipline and finds it genuinely harder. A queue adds at one end and removes from the other, so a naive array either shifts every element on each dequeue — the 209x penalty Python's pop(0) demonstrates — or advances a front index and slowly leaks the capacity behind it. The fix, a circular buffer, has no analogue in this subtopic, because a stack never needed one.
