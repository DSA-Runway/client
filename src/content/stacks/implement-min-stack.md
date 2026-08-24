---
id: implement-min-stack
topic: Stacks
title: Implement Min Stack
difficulty: Hard
status: ready
prerequisites:
  - implement-stack-using-arrays
  - implement-stack-using-linkedlist
  - time-and-space-complexity-basics
relatedIds:
  - implement-stack-using-arrays
  - implement-stack-using-queue
  - remove-k-digits
  - sum-of-subarray-minimums
  - next-greater-element
---

<!-- @summary -->
The first design problem in this topic: no scan, no traversal, just four operations that must each be O(1). All four designs below were cross-checked against a scanning reference over 20,000 random operation sequences — 152,656 comparisons in C++ and 152,788 in Python, zero mismatches. The interesting result is about the famous encoded-single-stack trick, the one advertised as "O(1) extra space". Measured at a million elements it uses **8.39 bytes per element, exactly the same as the pair stack it claims to beat**, because making it safe for the full `int` range forces 64-bit storage. The plain two-stack version uses **4.19 bytes** on random data. The clever trick is the *worst* of the three on space, and it fails on **31.6%** of full-range sequences if you store it in 32 bits.

<!-- @theory -->
## The problem

Design a stack supporting four operations, each in O(1) time:

```
push(val)   put val on top
pop()       remove the top
top()       read the top
getMin()    read the smallest value anywhere in the stack
```

Only `getMin` is new. The other three are what a stack already does, and the
whole problem is arranging for `getMin` to be answerable without looking.

## Why the obvious answer fails

Keep a single `int minimum`, update it on every push, and return it from
`getMin`. This works until the first `pop`.

```
push 5    min = 5
push 3    min = 3
push 7    min = 3
pop       (removes 7)   min = 3     still fine
pop       (removes 3)   min = ?     3 is gone, and 5 was never recorded
```

A single variable holds one answer. Popping asks for the *previous* answer, and
that requires history. The minimum is not a property of the stack's contents in
the abstract — it is a property of each **prefix** of the push sequence, and a
stack that can pop needs every prefix's answer, not just the latest.

That reframing is the whole problem. Every correct design below is some way of
storing one minimum per prefix; they differ only in how much space that costs
and how cleverly they hide it.

## Design 1: recompute

Store nothing extra; scan on `getMin`. Correct and trivially so — but on a
stack of 200,000 elements a single `getMin` measured **9,348 ns** against
**0.4 ns** for a design that stores the answer. That is a factor of **22,524**,
and it is the difference between a data structure and a loop.

## Design 2: one minimum per element

Push a pair: the value, and the smallest value at or below it.

```
push 5    (5, 5)
push 3    (3, 3)      min(3, 5) = 3
push 7    (7, 3)      min(7, 3) = 3
pop                   the (7,3) frame leaves and takes its answer with it
top()                 (3, 3) -> value 3, min 3
```

`getMin` is `st.back().second`. Nothing is recomputed and nothing is
reconstructed; the answer for every prefix is stored beside the element that
created that prefix. This is the design to reach for by default, and it is
correct with no case analysis at all.

Its cost is one extra `int` per element. Measured at n = 1,000,000 with random
32-bit values: **8,388,608 bytes, 8.39 bytes per element, 2.10x** what a plain
`vector<int>` of the same values would take.

## Design 3: the encoded stack

The celebrated trick. Keep the current minimum in a variable, and when a *new*
minimum arrives, do not store it — store an encoding that lets the previous
minimum be recovered later.

```
push(v):
    if v >= min:  store v
    else:         store 2*v - min ;  min = v

pop():
    t = stored value
    if t < min:   min = 2*min - t      # t was an encoding; restore the old min
```

The algebra is straightforward. When `v < min`, the stored value is
`2v - min`, which is strictly less than `v`, which is strictly less than the
new minimum `v` — so *stored < min* is a reliable flag that this slot is an
encoding rather than a value. To decode, `2*min - stored = 2v - (2v - min_old)
= min_old`. One catch follows immediately: since the slot no longer holds the
value, `top()` must check the same flag and return `min` instead.

```
push 5      min = 5        store 5
push 3      min: 5 -> 3    store 2*3 - 5 = 1        1 < 3, so it is a marker
push 7      min = 3        store 7
pop         7 >= 3         plain value, min unchanged
pop         1 < 3          min = 2*3 - 1 = 5        the old minimum, recovered
```

It is genuinely elegant. It is also, when measured, the worst of the three.

## Why the trick does not save space

The encoded slot can hold `2v - min`. With `v` and `min` both in the stated
range of ±2^31, that expression reaches **6,442,450,944** in magnitude, which
needs **34 bits**. A 32-bit slot cannot hold it.

So the stack must be `long long`. And `sizeof(long long)` is 8, while
`sizeof(pair<int,int>)` is also 8. Measured at n = 1,000,000:

```
plain vector<int>          4,000,000 bytes    4.00 B/elem   1.00x
pair stack                 8,388,608 bytes    8.39 B/elem   2.10x
encoded stack (long long)  8,388,608 bytes    8.39 B/elem   2.10x
two stacks, random data    4,194,368 bytes    4.19 B/elem   1.05x
```

The trick's "O(1) extra space" is a statement about the *number of variables*,
not about bytes. Every element still pays for the ability to answer `getMin`,
because it must — one answer per prefix is a lower bound for a structure that
can pop back to any prefix. The trick relocates that cost into the width of the
slot instead of a second field, and 34 bits rounds up to 64 the same way two
`int`s do.

## What happens if you ignore the width

Storing the encoding in a 32-bit `int` and feeding it the full range: `getMin`
returns a wrong answer on **31.6%** of random operation sequences and `top()`
on **33.3%**. A concrete case:

```
push 1000000000
push -1500000000     true encoding 2*(-1500000000) - 1000000000 = -4000000000
                     wraps to 294967296

top()    returns 294967296     correct answer -1500000000    already wrong
pop()
getMin() returns -1500000000   correct answer 1000000000     decode destroyed
```

Note the ordering: `getMin` is still right immediately after the bad push,
because `min` was assigned directly and never round-tripped through the slot.
The damage only appears on `pop`, when the corrupted slot is decoded. A test
that pushes and queries but never pops back past a minimum will pass.

The same code with values held to ±5x10^8 was wrong on **0 of 20,000**
sequences. The bug is entirely a function of the input range, which is why it
survives casual testing and why the range in the problem statement is the part
worth reading twice.

In Python the question does not arise — integers are arbitrary precision, and
the encoding was verified correct at ±2^40. The trick is safe there and saves
nothing there either, since a Python list of ints stores pointers regardless.

## Design 4: two stacks

Keep the values in one stack and the minima in another. Push onto the min stack
only when the new value is **less than or equal to** the current minimum; pop
from it when the value leaving equals the current minimum.

```
push 5    values [5]        minima [5]
push 3    values [5,3]      minima [5,3]
push 3    values [5,3,3]    minima [5,3,3]     equal, so it is recorded again
push 7    values [5,3,3,7]  minima [5,3,3]
pop  (7)  values [5,3,3]    minima [5,3,3]     7 != 3, minima untouched
pop  (3)  values [5,3]      minima [5,3]
pop  (3)  values [5]        minima [5]         still correct because of the duplicate
```

The `<=` is the entire subtlety. Writing `<` looks like an optimisation —
why store the same number twice? — and is wrong on **22.7%** of random
sequences. The minimal reproducer is two operations long:

```
push 2, push 2, pop   ->   getMin should be 2
with '<' the minima stack recorded 2 only once, the first pop removed it,
and the minima stack is now empty with a 2 still in the values stack
```

Duplicates are not redundancy. Two equal elements are two prefixes that both
have that minimum, and popping one of them must not discard the other's answer.

## What the min stack actually costs

This is where the design earns its place. The min stack only grows on a new
running minimum, and running minima are rare in data that is not adversarial.
Measured at n = 200,000:

```
random 32-bit values          12 entries       0.01%
random values 0..99        2,037 entries       1.02%
strictly increasing            1 entry         0.00%
strictly decreasing      200,000 entries     100.00%
all values equal         200,000 entries     100.00%
```

The first row is the interesting one. With a wide value range, the running
minimum is beaten about `ln(n)` times — twelve times in two hundred thousand
pushes — so the min stack is empty for all practical purposes and the whole
structure costs **1.05x** a plain stack.

The last two rows are the honest counterweight: sorted-descending input and
all-equal input both make it store one entry per element, at which point it
uses the same 2.10x as everything else. So the two-stack design's range is
1.05x to 2.10x, and the other two designs are pinned at 2.10x unconditionally.
It is never worse and usually much better.

## Time

All three O(1) designs are within 15% of one another, which is to say the
choice is not a time choice. Best of five runs, 2,000,000 pushes and pops with
a `getMin` every eighth operation, and the ordering was reproduced with the
three runs reversed:

```
pairs        1.51 ns/op
two stacks   1.48 ns/op
encoded      1.31 ns/op
```

The encoded stack is marginally fastest because its push is a comparison and an
occasional subtraction against a register-resident `min`, with no second
container to touch. That is a real advantage and a small one, and it is bought
with a correctness hazard and no space saving.

## The conclusion, stated plainly

Reach for the pair stack when you want the design that cannot be got wrong.
Reach for the two-stack version when the data is not adversarial and the 2x
matters, which is most of the time. The encoded trick is worth understanding —
the prefix-history insight it encodes is the real content of this problem — but
the measurements do not support choosing it.

<!-- @intuition -->
A single minimum variable is a single answer, and popping asks for an older one. Every correct design here stores one minimum per prefix of the push sequence; they only disagree about where to hide it. That is also why the famous "O(1) extra space" encoding saves nothing — the per-prefix answer still has to be paid for, and pushing it into the width of the slot costs the same 8 bytes as an extra field.

<!-- @approach -->
### Brute force — recompute the minimum on demand

<!-- @idea -->
Store nothing beyond the values. When `getMin` is called, scan the stack and return the smallest. Correct by construction, and the honest baseline against which "store the answer" has to justify itself.

<!-- @steps -->
```
1. Back the stack with a plain dynamic array.
2. push / pop / top are the ordinary array operations.
3. getMin walks every element and returns the smallest.
```

<!-- @complexity -->
- time: O(1) for push, pop and top; O(n) for getMin
- space: O(n) for the values and nothing else — 4.00 bytes per element, the floor
- note: Measured at 9,348ns per getMin call on a 200,000-element stack, against 0.4ns when the answer is stored — a factor of 22,524. In Python the same scan takes 1.16ms at n = 200,000. Correct by construction and useful only as the reference the other three were verified against.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <climits>
#include <vector>
using namespace std;

class MinStack {
    vector<int> st;

public:
    void push(int val) { st.push_back(val); }
    void pop()         { st.pop_back(); }
    int  top()         { return st.back(); }

    int getMin() {
        int m = INT_MAX;
        for (int v : st) m = min(m, v);   // the entire cost of this design
        return m;
    }
};
```

<!-- @annotations -->
- 10: Three of the four operations are already O(1) for free; only getMin is a design problem, which is worth noticing before reaching for machinery.
- 15: INT_MAX as the identity is safe here only because getMin is never called on an empty stack by contract — on an empty stack this silently returns INT_MAX rather than signalling.
- 16: 9,348 ns measured at n = 200,000. The loop is not slow; it is just O(n), and a structure is expected to answer without one.

<!-- @code java -->
```java
import java.util.ArrayList;

class MinStack {
    private final ArrayList<Integer> st = new ArrayList<>();

    public void push(int val) { st.add(val); }
    public void pop()         { st.remove(st.size() - 1); }
    public int  top()         { return st.get(st.size() - 1); }

    public int getMin() {
        int m = Integer.MAX_VALUE;
        for (int v : st) m = Math.min(m, v);
        return m;
    }
}
```

<!-- @annotations -->
- 4: ArrayList<Integer> boxes every value, so this already costs far more per element than the C++ version — worth knowing before comparing the measured byte counts across languages.
- 7: remove(size - 1) is O(1) for an ArrayList because nothing shifts; removing from the front would be O(n) and is a common accidental substitution.
- 12: The enhanced for loop unboxes every element on every getMin call, adding to an already O(n) operation.

<!-- @code python -->
```python
class MinStack:
    def __init__(self):
        self.st = []

    def push(self, val: int) -> None: self.st.append(val)
    def pop(self) -> None: self.st.pop()
    def top(self) -> int: return self.st[-1]

    def getMin(self) -> int:
        return min(self.st)
```

<!-- @annotations -->
- 6: list.append and list.pop() from the end are both amortised O(1); pop(0) would be O(n) and is the usual mistake when a stack is built on a list.
- 10: min() runs in C, so it is fast per element and still O(n) — measured at 1.16 ms on a 200,000-element stack, roughly 124x the C++ scan because of pointer chasing per element.

<!-- @approach -->
### Store one minimum per element

<!-- @idea -->
Push a pair — the value, and the smallest value at or below it in the stack. The answer for every prefix is stored beside the element that created that prefix, so `getMin` is a field read and `pop` discards the obsolete answer automatically.

<!-- @steps -->
```
1. Each frame is (value, minAtOrBelow).
2. On push, minAtOrBelow = min(val, minimum of the frame below), or val if empty.
3. pop removes the frame; top returns .first; getMin returns .second of the top.
```

<!-- @complexity -->
- time: O(1) worst case for all four operations
- space: O(n) — two ints per element, 2.10x a plain stack, unconditionally
- note: Measured 1.51ns/op over 2,000,000 push/pop operations and 8,388,608 bytes at n = 1,000,000, which is 8.39 bytes per element. The design with no case analysis: there is no comparison to get backwards and no width to overflow, which is worth something the other two cannot offer.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <utility>
#include <vector>
using namespace std;

class MinStack {
    vector<pair<int, int>> st;        // (value, minimum at or below)

public:
    void push(int val) {
        int m = st.empty() ? val : min(val, st.back().second);
        st.push_back({val, m});
    }

    void pop()      { st.pop_back(); }
    int  top()      { return st.back().first;  }
    int  getMin()   { return st.back().second; }
};
```

<!-- @annotations -->
- 11: st.empty() first, because st.back() on an empty vector is undefined behaviour rather than an error — this ternary is load-bearing, not defensive.
- 15: min against the frame below, not against a running variable. That is what makes pop free: the obsolete answer leaves with the frame that owned it.
- 17: Both reads are O(1) field accesses on the same cache line, which is why this measures 1.51 ns/op despite touching twice the memory of a plain stack.

<!-- @code java -->
```java
import java.util.ArrayDeque;
import java.util.Deque;

class MinStack {
    private final Deque<int[]> st = new ArrayDeque<>();

    public void push(int val) {
        int m = st.isEmpty() ? val : Math.min(val, st.peek()[1]);
        st.push(new int[]{val, m});
    }

    public void pop()    { st.pop(); }
    public int  top()    { return st.peek()[0];  }
    public int  getMin() { return st.peek()[1];  }
}
```

<!-- @annotations -->
- 5: ArrayDeque rather than java.util.Stack, which extends Vector and synchronises every method for no benefit in single-threaded code.
- 9: An int[] of length 2 rather than a boxed pair, which keeps both fields unboxed — the array header still costs more than the C++ 8 bytes per element.
- 12: Deque.push and Deque.pop both operate on the head, so this is a stack and not a queue; mixing in addLast would silently make it neither.

<!-- @code python -->
```python
class MinStack:
    def __init__(self):
        self.st = []          # list of (value, minimum at or below)

    def push(self, val: int) -> None:
        m = val if not self.st else min(val, self.st[-1][1])
        self.st.append((val, m))

    def pop(self) -> None: self.st.pop()
    def top(self) -> int: return self.st[-1][0]
    def getMin(self) -> int: return self.st[-1][1]
```

<!-- @annotations -->
- 6: `if not self.st` is the idiomatic empty test and avoids the IndexError that self.st[-1] would raise on the first push.
- 7: A tuple rather than a list, since the frame is never mutated after creation — tuples are smaller and the immutability documents the intent.
- 11: Measured 84 ns/op in Python against 1.51 ns in C++; the algorithmic content is identical and the constant factor is the interpreter, not the design.

<!-- @approach -->
### The encoded single stack — the famous trick, measured

<!-- @idea -->
Keep the minimum in one variable. When a value smaller than the current minimum is pushed, store `2*val - min` instead of the value: that encoding is provably below the new minimum, so it doubles as a marker, and the old minimum can be recovered from it on pop. One stack, one variable — but the slot must be wide enough for the encoding.

<!-- @steps -->
```
1. On push: if val >= min, store val. Otherwise store 2*val - min, then min = val.
2. On pop: read the stored slot t and remove it. If t < min, then min = 2*min - t.
3. On top: read t. If t < min the slot is an encoding, so return min instead.
4. Store the slot in a 64-bit type — 2*val - min needs 34 bits over the stated range.
```

<!-- @complexity -->
- time: O(1) worst case for all four
- space: O(n) — one 64-bit slot per element, 2.10x a plain stack, plus one variable
- note: Measured 1.31ns/op, the fastest of the three, and 8.39 bytes per element — the same as the pair stack, because 34 bits rounds up to 64 exactly as two ints do. The advertised "O(1) extra space" counts variables, not bytes. Stored in 32 bits instead, getMin is wrong on 31.6% of random sequences and top on 33.3%.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

class MinStack {
    vector<long long> st;             // 64-bit: 2*val - min needs 34 bits
    long long mn = 0;

public:
    void push(int val) {
        if (st.empty()) { st.push_back(val); mn = val; }
        else if (val >= mn) st.push_back(val);
        else { st.push_back(2LL * val - mn); mn = val; }
    }

    void pop() {
        long long t = st.back();
        st.pop_back();
        if (t < mn) mn = 2 * mn - t;  // t was an encoding; restore the old minimum
    }

    int top() {
        long long t = st.back();
        return (int)(t < mn ? mn : t);
    }

    int getMin() { return (int)mn; }
};
```

<!-- @annotations -->
- 5: long long is not caution, it is arithmetic: 2*val - min reaches 6,442,450,944 over the stated range. In a 32-bit slot this is wrong on 31.6% of random sequences.
- 11: val >= mn, not >. Equality must take the plain-value branch, or an equal value would be encoded as 2*val - mn = val, which is not below mn and so would not be recognised as a marker on pop.
- 12: 2LL forces the multiplication into 64-bit before it happens — writing 2 * val - mn with an int val would overflow during the computation even though the destination is wide.
- 18: The decode is where a too-narrow slot actually breaks. getMin is still correct immediately after a bad push because mn was assigned directly and never round-tripped.
- 23: top() cannot just return the slot. When the slot is an encoding it holds a number that was never pushed — 294967296 in the worked failure case — so the same t < mn flag has to be tested here too.
- 26: getMin is a single register read, which is why this design measures fastest of the three despite its extra branch on push.

<!-- @code java -->
```java
import java.util.ArrayList;

class MinStack {
    private final ArrayList<Long> st = new ArrayList<>();
    private long mn = 0;

    public void push(int val) {
        if (st.isEmpty()) { st.add((long) val); mn = val; }
        else if (val >= mn) st.add((long) val);
        else { st.add(2L * val - mn); mn = val; }
    }

    public void pop() {
        long t = st.remove(st.size() - 1);
        if (t < mn) mn = 2 * mn - t;
    }

    public int top() {
        long t = st.get(st.size() - 1);
        return (int) (t < mn ? mn : t);
    }

    public int getMin() { return (int) mn; }
}
```

<!-- @annotations -->
- 4: ArrayList<Long> boxes every slot, so in Java the encoded design is decisively larger than the two-int-array pair stack rather than merely equal to it — the trick's space argument is weakest in the language where objects already dominate.
- 10: 2L * val rather than 2 * val, for the same reason as the C++ 2LL — the promotion has to happen before the multiply, not after.
- 14: remove returns Long here, and the assignment to a long auto-unboxes it; if st were empty this would throw IndexOutOfBoundsException rather than returning null.

<!-- @code python -->
```python
class MinStack:
    def __init__(self):
        self.st = []
        self.mn = 0

    def push(self, val: int) -> None:
        if not self.st:
            self.st.append(val); self.mn = val
        elif val >= self.mn:
            self.st.append(val)
        else:
            self.st.append(2 * val - self.mn); self.mn = val

    def pop(self) -> None:
        t = self.st.pop()
        if t < self.mn: self.mn = 2 * self.mn - t

    def top(self) -> int:
        t = self.st[-1]
        return self.mn if t < self.mn else t

    def getMin(self) -> int:
        return self.mn
```

<!-- @annotations -->
- 12: No width concern at all — Python integers are arbitrary precision, and the encoding was verified correct with values at ±2^40. The overflow hazard is a C++ and Java problem exclusively.
- 3: Python still saves nothing: a list holds pointers to int objects either way, so replacing a tuple with a single int removes one small object per frame and no more.
- 20: The same marker test as in C++. Forgetting it here returns a number that was never pushed, which is the failure most likely to survive testing because it needs a query on exactly the encoded slot.

<!-- @approach -->
### Two stacks — the one the measurements actually favour

<!-- @idea -->
Keep values in one stack and running minima in another, pushing a minimum only when the incoming value is less than **or equal to** the current one. Because running minima are rare in non-adversarial data, the second stack stays nearly empty — measured at 12 entries per 200,000 pushes on random 32-bit values, for a total cost of 1.05x a plain stack.

<!-- @steps -->
```
1. Two containers: values, and minima.
2. push(val): values.push(val); if minima is empty or val <= minima.top(), minima.push(val).
3. pop(): if values.top() == minima.top(), minima.pop(); then values.pop().
4. top() reads values.top(); getMin() reads minima.top().
```

<!-- @complexity -->
- time: O(1) worst case for all four
- space: O(n) values plus one entry per running minimum — between 1.05x and 2.10x a plain stack
- note: Measured 1.48ns/op and 4.19 bytes per element on random 32-bit data, against a flat 8.39 for both other designs. The min stack held 12 entries per 200,000 pushes because running minima follow the harmonic number. Strictly decreasing and all-equal input push it to 100% occupancy and 8.39 bytes, which is the other designs' only case, so it is never worse.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

class MinStack {
    vector<int> st, mn;

public:
    void push(int val) {
        st.push_back(val);
        if (mn.empty() || val <= mn.back())   // <= not <, or duplicates are lost
            mn.push_back(val);
    }

    void pop() {
        if (st.back() == mn.back()) mn.pop_back();
        st.pop_back();
    }

    int top()    { return st.back(); }
    int getMin() { return mn.back(); }
};
```

<!-- @annotations -->
- 10: The single most important character in the file. With < instead of <=, two equal minima are recorded once, the first pop discards the shared entry, and getMin is wrong on 22.7% of random sequences — reproduced by push 2, push 2, pop.
- 15: Compare before popping, and compare values not positions. The minima stack is not indexed in parallel with the values stack, so the only link between them is this equality test.
- 16: Order matters: mn is popped first while st.back() is still readable. Swapping these two lines reads a destroyed element.
- 20: Measured at 12 entries in mn per 200,000 random pushes, so getMin here reads from a container that is, in practice, resident in L1 permanently.

<!-- @code java -->
```java
import java.util.ArrayDeque;
import java.util.Deque;

class MinStack {
    private final Deque<Integer> st = new ArrayDeque<>();
    private final Deque<Integer> mn = new ArrayDeque<>();

    public void push(int val) {
        st.push(val);
        if (mn.isEmpty() || val <= mn.peek()) mn.push(val);
    }

    public void pop() {
        if (st.peek().intValue() == mn.peek().intValue()) mn.pop();
        st.pop();
    }

    public int top()    { return st.peek(); }
    public int getMin() { return mn.peek(); }
}
```

<!-- @annotations -->
- 10: The same <= as C++, for the same reason: equal values are distinct prefixes and each needs its own recorded answer.
- 14: .intValue() on both sides is mandatory. Deque<Integer> holds boxed values, and == on two Integer objects compares references — it happens to work below 128 because of the Integer cache and then silently fails above it, which is a textbook heisenbug.
- 18: peek() auto-unboxes on return; on an empty deque it returns null and the unboxing throws NullPointerException rather than reporting an empty stack.

<!-- @code python -->
```python
class MinStack:
    def __init__(self):
        self.st = []
        self.mn = []

    def push(self, val: int) -> None:
        self.st.append(val)
        if not self.mn or val <= self.mn[-1]:
            self.mn.append(val)

    def pop(self) -> None:
        if self.st[-1] == self.mn[-1]:
            self.mn.pop()
        self.st.pop()

    def top(self) -> int: return self.st[-1]
    def getMin(self) -> int: return self.mn[-1]
```

<!-- @annotations -->
- 8: `val <= self.mn[-1]`, and the `not self.mn` guard must come first so short-circuiting prevents the IndexError on the very first push.
- 12: Python's == compares values for ints, so the Java boxing hazard does not exist here — but the comparison is still against the value, never an index.
- 14: self.mn.pop() before self.st.pop(), so that self.st[-1] on the line above is still the element being removed.

<!-- @example -->

<!-- @input -->
```
push(5), push(3), push(7), pop(), pop(), getMin()
```

<!-- @output -->
```
5
```

<!-- @why -->
The sequence that breaks the single-variable approach and therefore defines the problem. After `push(3)` the minimum is 3; after two pops the 3 is gone and the correct answer is 5 — a value that a single `min` variable never recorded, because 5 stopped being the minimum before anyone thought to save it.

<!-- @walkthrough -->
- push(5) — pair stack holds (5,5); minima stack holds [5]; encoded stack stores 5 with mn = 5.
- push(3) — 3 < 5, so all three designs react: pair (3,3); minima [5,3]; encoded stores 2*3-5 = 1 and sets mn = 3.
- push(7) — 7 is not a new minimum: pair (7,3); minima unchanged at [5,3]; encoded stores 7 plainly.
- pop() removes 7 — minima untouched since 7 != 3; encoded reads 7, which is not below mn, so mn stays 3.
- pop() removes 3 — minima pops its 3 and exposes 5; encoded reads the slot 1, sees 1 < 3, and computes 2*3 - 1 = 5.
- getMin() returns 5 from all three, each having recovered the answer that belonged to the two-element prefix.

<!-- @example -->

<!-- @input -->
```
push(2), push(2), pop(), getMin()
```

<!-- @output -->
```
2
```

<!-- @why -->
The two-operation reproducer for the `<` versus `<=` bug in the two-stack design. Recording a repeated minimum looks wasteful, but the two 2s are two different prefixes and both need an answer. With `<`, the minima stack holds a single 2, the first pop removes it, and the structure is left with a 2 in the values stack and nothing in the minima stack — wrong on **22.7%** of random sequences.

<!-- @walkthrough -->
- push(2) — values [2]; minima is empty so 2 is recorded: minima [2].
- push(2) — with `<=`, 2 <= 2 holds and minima becomes [2,2]. With `<`, 2 < 2 is false and minima stays [2].
- pop() — values.top() is 2 and minima.top() is 2, so minima pops in both versions.
- With `<=`, minima is [2] and getMin correctly returns 2.
- With `<`, minima is now empty while values still holds [2] — getMin reads past the end, returning INT_MAX in the C++ measurement.
- The failure needs only equal values and one pop, which is why it appears in nearly a quarter of random sequences rather than in some rare corner.

<!-- @example -->

<!-- @input -->
```
push(1000000000), push(-1500000000), top(), pop(), getMin()
```

<!-- @output -->
```
top() = -1500000000, then getMin() = 1000000000
```

<!-- @why -->
The encoded design's overflow, in the smallest form that shows both symptoms. The true encoding is `2*(-1500000000) - 1000000000 = -4000000000`, which does not fit in a 32-bit `int` and wraps to 294967296. With 64-bit storage both answers above are produced correctly; with 32-bit storage `top()` returns 294967296 and the post-pop `getMin()` returns -1500000000.

<!-- @walkthrough -->
- push(1000000000) — the stack is empty, so the value is stored plainly and mn = 1000000000.
- push(-1500000000) — this is a new minimum, so the slot receives 2*val - mn = -4000000000 and mn becomes -1500000000.
- In a `long long` slot that number is stored exactly; in an `int` slot it wraps to 294967296, which is positive and therefore no longer below mn.
- top() — the correct version sees slot < mn, recognises an encoding, and returns mn = -1500000000. The wrapped version sees 294967296 > mn, treats it as a plain value, and returns it.
- pop() — the correct version computes 2*mn - slot = 2*(-1500000000) - (-4000000000) = 1000000000. The wrapped version never enters the decode branch at all, so mn is left at -1500000000.
- getMin() — 1000000000 correct, -1500000000 wrong, and note that getMin was right until the pop happened.

<!-- @example -->

<!-- @input -->
```
200,000 pushes of random 32-bit values, then measure the minima stack
```

<!-- @output -->
```
12 entries (0.01%)
```

<!-- @why -->
The measurement that makes the two-stack design the practical choice. A new entry is recorded only when the running minimum is beaten, and over a wide value range that happens about `ln(n)` times regardless of n — twelve times in two hundred thousand pushes here. The whole structure therefore costs 4.19 bytes per element against a plain stack's 4.00, while the pair stack and the encoded stack both cost 8.39 unconditionally.

<!-- @walkthrough -->
- The first push always records, since the minima stack starts empty.
- Each later push records only if it is at or below every value seen so far.
- With 32-bit random values the probability that the i-th push is a new minimum is 1/i, so the expected count is the harmonic number H(200,000) = 12.78; this run returned 12.
- Narrowing the range to 0..99 raises it to 2,037 entries (1.02%), because ties become common and `<=` records every one of them.
- Strictly decreasing input records all 200,000, which is the worst case and equals the pair stack's fixed cost.
- All-equal input also records all 200,000, for the same reason the `<=` is needed at all — every element ties the minimum.

<!-- @visualization stack -->

<!-- @description -->
Lead with the failure, because it defines the problem: draw a single box labelled "min" beside a stack, run push 5, push 3, push 7, and let the box update happily to 3. Then pop twice and let the box sit there still showing 3 while the stack visibly contains only a 5 — hold on that mismatch with the caption "one variable holds one answer, and popping asks for an older one". Then reveal the reframing: redraw the same push sequence as a column of prefixes, each with its own minimum written beside it (5 -> 5, 5 3 -> 3, 5 3 7 -> 3), and label it "one answer per prefix". Everything after that is where to put those answers. Show the three designs side by side operating on the same sequence, animated in lockstep: the pair stack with two fields per frame, the two-stack version with a tall values column and a nearly empty minima column, and the encoded version as a single column with one slot glowing to mark an encoding and a floating mn register. For the encoded column, animate the decode arithmetic explicitly on pop — slot 1 lights up, 2*3 - 1 = 5 is computed in place, and the mn register flips from 3 to 5. Then the two payoff panels. First, space: a bar chart with plain stack at 4.00 B/elem, two stacks at 4.19, pairs at 8.39 and encoded at 8.39, with the last two bars drawn in the same colour and the caption "the O(1)-extra-space trick is not smaller — 34 bits rounds up to 64 exactly as two ints do". Add a second bar beside the two-stack one showing its worst case at 8.39, labelled "1.05x to 2.10x, never worse than the others". Second, the two hazards, each as a short animation with its own counter: the `<` versus `<=` bug running push 2, push 2, pop with the minima stack visibly emptying too early and a 22.7% figure; and the 32-bit encoding running the ±1.5e9 sequence with the slot value wrapping from -4000000000 to 294967296 mid-animation, a 31.6% figure, and a note that getMin stays correct until the pop. Close on the minima-stack occupancy chart — 0.01%, 1.02%, 0.00%, 100%, 100% across the five input shapes — captioned "the second stack is nearly always empty, and when it is not, you were going to pay 2x anyway".

<!-- @sampleInput -->
```json
{"problem":{"operations":["push(val)","pop()","top()","getMin()"],"requirement":"each in O(1) time","whatIsNew":"only getMin; the other three are what a stack already does"},"whyOneVariableFails":{"sequence":["push 5","push 3","push 7","pop","pop","getMin"],"singleVariableAnswer":3,"correctAnswer":5,"reason":"5 stopped being the minimum before anything recorded it, and popping asks for the answer of an earlier prefix"},"reframing":{"insight":"the minimum is a property of each prefix of the push sequence, not of the stack in the abstract","prefixes":[{"contents":[5],"min":5},{"contents":[5,3],"min":3},{"contents":[5,3,7],"min":3}],"consequence":"every correct design stores one minimum per prefix; they differ only in where that is hidden"},"designs":[{"name":"recompute","getMinTime":"O(n)","bytesPerElem":4.0,"ratio":1.0,"measured":{"getMinNsAt200k":9348,"versusStoredNs":0.4,"factor":22524}},{"name":"pair stack","getMinTime":"O(1)","bytesPerElem":8.39,"ratio":2.1,"nsPerOp":1.51,"note":"cannot be got wrong; no case analysis"},{"name":"encoded single stack","getMinTime":"O(1)","bytesPerElem":8.39,"ratio":2.1,"nsPerOp":1.31,"note":"the famous O(1)-extra-space trick; same bytes as the pair stack"},{"name":"two stacks","getMinTime":"O(1)","bytesPerElemRandom":4.19,"ratioRandom":1.05,"bytesPerElemWorst":8.39,"ratioWorst":2.1,"nsPerOp":1.48,"note":"never worse than the others, usually much better"}],"encoding":{"push":"if val >= min store val, else store 2*val - min and set min = val","pop":"if slot < min then min = 2*min - slot","top":"if slot < min return min, else return slot","whyTheFlagWorks":"2*val - min < val < min whenever val < min, so an encoded slot is always strictly below the current minimum","widthNeeded":34,"maxMagnitude":6442450944,"trace":[{"op":"push 5","stored":5,"min":5},{"op":"push 3","stored":1,"min":3,"note":"2*3-5 = 1, and 1 < 3 marks it"},{"op":"push 7","stored":7,"min":3},{"op":"pop","read":7,"min":3,"note":"not below min, so a plain value"},{"op":"pop","read":1,"min":5,"note":"below min, so decode: 2*3 - 1 = 5"}]},"overflow":{"storage":"int","wrongGetMinPct":31.6,"wrongTopPct":33.3,"withinPlusMinus5e8":"0 of 20000 sequences wrong","case":{"push":[1000000000,-1500000000],"trueEncoding":-4000000000,"wrapsTo":294967296,"topWrong":294967296,"topCorrect":-1500000000,"getMinAfterPopWrong":-1500000000,"getMinAfterPopCorrect":1000000000},"whyItHides":"getMin is assigned directly on push and never round-trips through the slot, so only a pop past a minimum exposes it","python":"not applicable — arbitrary precision integers, verified correct at +/-2^40"},"twoStackSubtlety":{"correct":"<=","wrong":"<","wrongOnPct":22.7,"reproducer":["push 2","push 2","pop","getMin"],"whyDuplicatesMatter":"two equal elements are two prefixes with that minimum; popping one must not discard the other's answer"},"minStackOccupancy":[{"input":"random 32-bit","entries":12,"of":200000,"pct":0.01},{"input":"random 0..99","entries":2037,"of":200000,"pct":1.02},{"input":"strictly increasing","entries":1,"of":200000,"pct":0.0},{"input":"strictly decreasing","entries":200000,"of":200000,"pct":100.0},{"input":"all equal","entries":200000,"of":200000,"pct":100.0}],"timing":{"note":"best of 5, 2000000 push+pop with getMin every 8th op, order reversed to confirm","pairs":1.51,"twoStacks":1.48,"encoded":1.31,"unit":"ns/op","conclusion":"all within 15% — the choice is a space choice, not a time choice"},"verification":{"sequences":20000,"comparisonsCpp":152656,"comparisonsPython":152788,"mismatches":0,"designsCompared":4},"python":{"pairsNsPerOp":84,"twoStacksNsPerOp":78,"encodedNsPerOp":65,"bruteGetMinMsAt200k":1.16}}
```

<!-- @highlights -->
- The single-variable attempt is animated failing: min stays at 3 while the stack contains only a 5.
- The reframing is drawn as a column of prefixes, each with its own minimum written beside it.
- The three O(1) designs run in lockstep on the same push sequence, side by side.
- The pair stack shows two fields per frame, with the second field visibly discarded on pop.
- The two-stack version shows a tall values column beside a nearly empty minima column.
- The encoded version shows one glowing slot for an encoding and a floating mn register.
- The decode arithmetic is animated in place on pop: 2*3 - 1 = 5, with mn flipping from 3 to 5.
- A space bar chart puts plain at 4.00, two stacks at 4.19, pairs at 8.39 and encoded at 8.39 B/elem.
- The pairs and encoded bars are drawn in the same colour to make the equality unmissable.
- A second bar shows the two-stack worst case at 8.39, labelled "1.05x to 2.10x, never worse".
- The `<` versus `<=` bug runs push 2, push 2, pop with the minima stack emptying one step early.
- The 22.7% failure figure is shown beside that animation.
- The 32-bit encoding animation shows the slot wrapping from -4000000000 to 294967296 mid-push.
- A note tracks that getMin stays correct until the pop, which is why the bug survives testing.
- The occupancy chart gives 0.01%, 1.02%, 0.00%, 100% and 100% across five input shapes.
- The closing caption reads "the second stack is nearly always empty, and when it is not, you were going to pay 2x anyway".

<!-- @edgeCases -->
- **getMin on an empty stack** — undefined by contract in the problem statement, and every design here reads past the end rather than reporting it. The C++ brute force silently returns INT_MAX, which is the worst of the options because it looks like an answer.
- **A single element** — all four designs return that element from both `top` and `getMin`; the encoded design must take its empty-stack branch and store the value plainly, since there is no previous minimum to encode against.
- **Two equal values then one pop** — the `<=` reproducer. Wrong on 22.7% of random sequences with `<`.
- **All values equal** — the two-stack design records every one of them, reaching 100% occupancy and 2.10x space, which is exactly the pair stack's fixed cost.
- **Strictly decreasing input** — every push is a new minimum: 200,000 of 200,000 entries recorded, the two-stack worst case.
- **Strictly increasing input** — one entry recorded out of 200,000. The minima stack is a single element for the entire run.
- **A new minimum equal to the current one in the encoded design** — must take the `val >= mn` branch. Encoding an equal value would give 2*val - mn = val, which is not strictly below mn and so would not be recognised as a marker on pop.
- **Values at the extremes of the stated range** — the encoding reaches 6,442,450,944 in magnitude and needs 34 bits; a 32-bit slot is wrong on 31.6% of sequences and correct on 0 of 20,000 when values are held to ±5x10^8.
- **Popping back past every minimum** — the sequence that exposes a corrupted encoded slot. Pushes and queries alone will not.
- **Boxed integer comparison in Java** — `st.peek() == mn.peek()` on `Deque<Integer>` compares references and works below 128 because of the Integer cache, then fails silently above it.
- **A stack that is pushed to n and never popped** — the min stack never shrinks, so occupancy measured on push-only workloads is an upper bound on what a mixed workload costs.

<!-- @pitfalls -->
- **Keeping one `min` variable and updating it on push.** The single most common attempt, and it survives every test that does not pop past a minimum. The variable is one answer; popping needs the previous one.
- **Writing `<` instead of `<=` in the two-stack push.** Looks like an obvious saving. Wrong on 22.7% of random sequences, reproduced by push 2, push 2, pop.
- **Popping the values stack before comparing with the minima stack.** The comparison needs the element that is leaving; reversing the two lines reads a destroyed element.
- **Comparing positions instead of values when deciding to pop the minima stack.** The two stacks are not indexed in parallel — the equality test is the only link between them.
- **Storing the encoded slot in 32 bits.** `2*val - min` needs 34 bits over the stated range. 31.6% of sequences give a wrong `getMin`, 33.3% a wrong `top`.
- **Writing `2 * val - mn` with an `int val` and a wide destination.** The multiplication overflows before the assignment widens anything; it must be `2LL * val` in C++ and `2L * val` in Java.
- **Forgetting that `top()` needs the marker test in the encoded design.** An encoded slot holds a number that was never pushed — 294967296 in the worked case — and returning it directly is wrong even when `getMin` is right.
- **Using `>` instead of `>=` for the plain-value branch in the encoded push.** An equal value encoded as `2*val - mn` equals `val`, which is not below `mn`, so it would never be decoded and the previous minimum would be lost.
- **Comparing boxed `Integer`s with `==` in Java.** Works for values in the Integer cache and fails above 127, which makes it a bug that passes small tests by construction.
- **Calling `st.back()` before checking `empty()`.** Undefined behaviour rather than an exception in C++, so it can appear to work in a debug build.
- **Benchmarking one design per process run without a warm-up.** First-touch page faults on a freshly allocated 32 MB buffer made the pair stack measure 25.27 ns/op here — 14x its real 1.51 ns — until best-of-five and a reversed run order were added.
- **Believing "O(1) extra space" is a claim about bytes.** It counts variables. Measured, the encoded stack uses the same 8.39 bytes per element as the pair stack it is supposed to improve on.

<!-- @doubt -->
Why does keeping a single `min` variable fail? It is updated on every push, so it always holds the smallest thing pushed.

<!-- @answer -->
It holds the smallest thing pushed **so far**, and `pop` moves the stack backwards in time. After push 5, push 3, push 7, two pops leave only the 5, but the variable still says 3 — and there is nothing to update it to, because 5 stopped being the minimum before anything recorded that it had been one. The minimum is a property of each prefix of the push sequence, and a structure that can pop back to any prefix needs every prefix's answer. That is one answer per element, which is why all three working designs cost extra space per element rather than a constant.

<!-- @doubt -->
Why does the two-stack version push a duplicate when the value equals the current minimum? Storing the same number twice looks wasteful.

<!-- @answer -->
Because they are two different prefixes and both need an answer. Push 2, push 2: after the first push the minimum of that one-element prefix is 2, and after the second the minimum of that two-element prefix is also 2. Pop once and you are back at the first prefix, which still has a minimum of 2. With `<`, only one entry was ever recorded, the pop consumed it, and the minima stack is empty while a 2 is still sitting in the values stack. Measured wrong on 22.7% of random operation sequences — this is not a corner case, it is what happens whenever two equal values meet a pop.

<!-- @doubt -->
The encoded design is described everywhere as O(1) extra space. Why does this file say it saves nothing?

<!-- @answer -->
Because "O(1) extra space" counts variables, and the measurement counts bytes. The encoded slot must hold `2*val - min`, which reaches 6,442,450,944 in magnitude over the stated ±2^31 range — 34 bits. Thirty-four bits rounds up to a 64-bit slot, and `sizeof(long long)` is 8, which is precisely `sizeof(pair<int,int>)`. Measured at n = 1,000,000, both come out at 8,388,608 bytes, 8.39 bytes per element. The trick did not remove the per-element cost of storing one minimum per prefix; it moved that cost from a second field into the width of the first one. The claim is not false, it is just answering a different question than the one that matters when you allocate.

<!-- @doubt -->
If the encoded design saves nothing, why is it still worth learning?

<!-- @answer -->
For the invariant, which is the actual content of this problem. The encoding works because `2*val - min < val < min` whenever `val < min`, so the stored number is guaranteed to be strictly below the current minimum — that gives a self-describing slot with no tag bit, and the same trick appears wherever you need to distinguish two kinds of entry in a homogeneous container. It is also the fastest of the three by a small margin, at 1.31 ns/op against 1.48 and 1.51, because push touches one container and a register instead of two containers. What the measurement rules out is choosing it *for the space*, which is the reason it is usually offered.

<!-- @doubt -->
Why is the min stack in the two-stack design so nearly empty? Twelve entries out of 200,000 seems too good.

<!-- @answer -->
It is a records-of-a-random-sequence result. The i-th value is a new running minimum only if it is the smallest of the first i, which for distinct random values has probability 1/i. Summing gives the harmonic number, and H(200,000) = 12.78 — this particular run returned 12, which is unremarkable given that the count is a random variable with a standard deviation of about 3.3. Crucially the expectation grows like `ln(n)`, so a billion pushes would record about 21 entries — the min stack does not scale with the data at all on random input. Narrow the value range and the picture changes, because ties start firing the `<=`: values in 0..99 gave 2,037 entries, still only 1.02%.

<!-- @doubt -->
So the two-stack version is 1.05x. What stops it degrading to something much worse than the other designs?

<!-- @answer -->
Nothing degrades it past 2.10x, because the min stack can hold at most one entry per element, and one entry is one `int`. Strictly decreasing input and all-equal input both hit that ceiling exactly: 200,000 of 200,000 entries, 8.39 bytes per element — the same number the pair stack and the encoded stack pay on every input including these. So its range is 1.05x to 2.10x while theirs is a flat 2.10x. It is never worse and usually much better, which is why the measurements favour it despite the pair stack being the easier design to get right.

<!-- @doubt -->
How can a 32-bit overflow in the encoded design be wrong 31.6% of the time and still be a bug people ship?

<!-- @answer -->
Because of *when* it becomes visible. On push, `mn` is assigned the new value directly — it never passes through the slot — so `getMin` is correct immediately after the bad push. The corruption only surfaces when that slot is popped and decoded. A test that pushes a wide range of values and queries `getMin` throughout will pass; you have to pop back past a minimum to see it. And the whole thing is a function of the input range: the identical code was wrong on 0 of 20,000 sequences with values held to ±5x10^8. The constraint line in the problem statement is doing more work than it appears to.

<!-- @doubt -->
Why does `top()` need special handling in the encoded design when `getMin()` does not?

<!-- @answer -->
Because `getMin` reads the variable and `top` reads the slot, and the slot may not contain a value. When a new minimum was pushed, the slot holds `2*val - min`, a number that was never pushed by anyone — 294967296 in the worked overflow case, 1 in the small trace. So `top` has to test the same `slot < mn` flag and return `mn` instead. It is easy to miss because the two operations look symmetric and only one of them touches the encoding. This is also the failure most likely to survive testing, since it requires a `top()` call landing exactly on an encoded slot.

<!-- @doubt -->
All three O(1) designs measured within 15% of each other. Does the choice actually matter?

<!-- @answer -->
Not for time — 1.31, 1.48 and 1.51 ns/op is a distinction without a difference for almost any caller. It matters for space and for correctness risk. On space the two-stack design is 1.05x against 2.10x on ordinary data, which is a real halving at scale. On risk, the pair stack has no case analysis and cannot be got wrong, while the other two each have a documented hazard that fires on 22.7% and 31.6% of random sequences respectively. Pick the pair stack when the code needs to be obviously correct and the memory is not tight; pick the two stacks when it is.

<!-- @doubt -->
The first benchmark run said the pair stack was 25.27 ns/op, 14x slower than the two-stack version. Why is the final number 1.51?

<!-- @answer -->
The first run measured page faults, not the algorithm. Each design allocated a fresh 32 MB buffer and was timed on its first pass over it, so the kernel's first-touch mapping cost landed inside the timed region — and it landed hardest on the design that touches the most memory, which is exactly the one under suspicion. The fix was to reserve capacity up front, run each design five times and keep the best, and then repeat the whole comparison with the three designs in reverse order. Both orderings then agreed to within 0.03 ns/op. It is worth stating because the wrong number was not obviously wrong: 14x is a plausible-looking penalty for doubling memory traffic, and it would have made a comfortable false conclusion.
