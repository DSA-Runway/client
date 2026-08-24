---
id: stock-span-problem
topic: Stacks
title: Stock span problem
difficulty: Hard
status: ready
prerequisites:
  - next-greater-element
  - implement-stack-using-arrays
  - largest-rectangle-in-a-histogram
  - next-smaller-element
relatedIds:
  - next-greater-element
  - largest-rectangle-in-a-histogram
  - maximum-rectangles
  - next-smaller-element
  - implement-min-stack
---

<!-- @summary -->
The first problem in this topic whose input arrives **online** — each span must be answered before the next price is seen — and the measured payoff is that the constraint costs nothing: the best streaming algorithm is also the best algorithm outright. That is the reverse of the previous subtopic, where having all the rows in hand let a DP beat the stack. Two other results: the O(n^2) brute force ranges from **1x to 6,229x** slower depending purely on the shape of the prices, and it is *2x* on the input anyone would benchmark with. And a stack storing `(price, span)` pairs, which needs no price history at all, is the fastest of three linear methods on random data in C++ (0.93x) while being the slowest in Python — 232 bytes of retained state against 4 MB.

<!-- @theory -->
## The problem

For each day, the span is the number of consecutive days up to and including
today on which the price was **less than or equal to** today's price.

```
prices  100  80  60  70  60  75  85
span      1   1   1   2   1   4   6
```

Day 6 has a span of 4 because 75 beats 60, 70 and 60 going back, and stops at
80. Day 7 has a span of 6 because 85 beats everything back to the 100.

## What the span actually is

Rewrite it as a distance rather than a count. Let `prevGreater(i)` be the index
of the nearest earlier day with a **strictly greater** price, or -1 if there is
none. Then

```
span[i] = i - prevGreater(i)
```

That is the whole problem, and it is the previous-greater-element query this
topic has already built twice. Everything below is about how to answer it.

## The part that is new: the input is online

Every problem in this topic so far has been handed the whole array. This one is
usually posed as a running service: prices arrive one at a time, and each span
must be returned before the next price is revealed. That rules out any right-to-
left pass, any precomputed suffix array, and the row-carrying trick that beat
the stack in the previous subtopic.

The measured result is that it costs nothing. The monotonic stack computes
`span[i]` from information it already holds, writes it once, and never revises
it — so the same algorithm that is optimal offline is already legal online.
There is no faster offline method to give up.

That is worth stating alongside the previous subtopic's opposite conclusion. In
Maximum Rectangles the extra structure — rows to carry boundaries between — let
a stackless DP beat the stack at nearly every density. Here there is no extra
structure to exploit, so the stack is unbeaten again. The pattern across the
topic is consistent: **the monotonic stack is the right answer exactly when the
only structure available is the order of the elements**, which is precisely what
an online stream gives you.

## The stack

Keep a stack of indices whose prices are strictly decreasing from bottom to top.
When price `i` arrives, pop everything with a price `<= p[i]` — those days can
never be anyone's previous-greater again, because `i` is later and at least as
tall. Whatever remains on top is `prevGreater(i)`.

```
prices  100  80  60  70  60  75  85

100     stack [100]                          span 1
 80     100 > 80, nothing pops               span 1     stack [100,80]
 60     80 > 60, nothing pops                span 1     stack [100,80,60]
 70     pops 60                              span 2     stack [100,80,70]
 60     70 > 60, nothing pops                span 1     stack [100,80,70,60]
 75     pops 60, 70                          span 4     stack [100,80,75]
 85     pops 75, 80                          span 6     stack [100,85]
```

Each index is pushed once and popped at most once, so the total work is O(n)
even though a single query can pop many entries. Measured at n = 200,000 with
random prices: 199,984 pops, or 1.00 per element.

## The tie convention, which here is not free

The span counts days at prices **less than or equal to** today's, so the pop
test must be `<=`. Using `<` is wrong on **71.73%** of random price series, and
the smallest counterexample is two days long:

```
[1,1]   ->   spans [1,1],   correct [1,2]
```

Two equal prices: the second day's span should be 2, because yesterday's price
was not greater than today's. Popping only on strict inequality leaves
yesterday on the stack as a false previous-greater.

This is a third distinct regime for tie conventions in as many subtopics.
Trapping Rainwater accepted all four combinations because a tie contributes zero
water. Largest Rectangle accepted three of four because it takes a maximum.
Here the definition of the answer names the tie explicitly — "less than or
equal to" — so there is exactly one correct choice, and it is the one the
problem statement already told you.

## The brute force is not always slow, and that is the trap

Walking backwards from each day until a greater price appears is O(n^2) in the
worst case. Measured at n = 50,000 against the stack:

```
shape                     brute            stack        ratio
random 1..100000          974,875 ns     560,833 ns         2x
strictly decreasing        43,709 ns      67,042 ns         1x   (brute wins)
random 1..4           167,784,000 ns     436,958 ns       384x
strictly increasing   647,156,833 ns     104,500 ns     6,193x
all equal             650,942,333 ns     104,500 ns     6,229x
```

Three things in that table are worth stopping on.

**On random wide-range prices the brute force is 2x.** With prices drawn from
1..100000 the expected span is about 2, so the backward walk almost never runs.
That is the input a benchmark would use, and it reports a small constant factor.

**On strictly decreasing prices the brute force is faster than the stack.**
Every span is 1, so brute does exactly one comparison per day, while the stack
pays for a push each day and never gets to pop. Not a rounding error — 43,709 ns
against 67,042 ns.

**Narrowing the value range to 1..4 costs 384x.** Nothing about the input got
bigger; ties simply became common, which makes spans long. The all-equal case is
the extreme at 6,229x.

So the brute force's cost varies by a factor of about six thousand across
inputs of identical size. This is the same hazard shape as the previous
subtopic's height rebuild, and the same lesson: when an algorithm's cost depends
on a property of the data rather than its size, the random-input benchmark is
the one test guaranteed not to find it.

## Span jumping: the same idea without a stack

There is a well-known stackless method. Compute spans left to right, and use
already-computed spans to leap backwards:

```
span[i] = 1
while i - span[i] >= 0 and p[i - span[i]] <= p[i]:
    span[i] += span[i - span[i]]
```

Each jump skips an entire block that is already known to be no taller. It is
also online — every value it reads is already computed — and it performs the
same 1.00 jump steps per element that the stack performs pops.

Its weakness is not the step count but the **distance**. Measured at
n = 200,000:

```
shape                  jump steps/elem     total distance/elem
random 1..100000              1.00                 11.2
random 1..4                   1.00             24,983.7
strictly increasing           1.00             99,999.5
strictly decreasing           0.00                  0.0
all equal                     1.00             99,999.5
```

Same number of operations, but on increasing or tied prices each read lands
roughly `n/2` elements back — a cache miss every time. The stack reads only its
own top, which is always hot. That is why span jumping measures 3,883,917 ns on
strictly increasing input against the stack's 2,068,291 ns despite doing the
same amount of nominal work.

It is a genuinely useful technique — it needs no auxiliary container, and it is
the natural formulation when the spans are wanted as an array anyway — but it
trades a bounded-locality read for an unbounded one.

## Storing prices in the stack instead of indices

For a true streaming service there is a better shape. Instead of a stack of
indices into a price array, keep a stack of `(price, span)` pairs:

```
next(price):
    span = 1
    while stack is non-empty and stack.top().price <= price:
        span += stack.top().span
        pop
    push (price, span)
    return span
```

The accumulated `span` replaces the index arithmetic, and the consequence is
that **the price history is never needed**. The index version must retain every
price forever so that `p[st.back()]` can be read; this one retains only the
stack.

Measured at n = 1,000,000 with random prices, the peak stack depth was **29
entries — 232 bytes** — against 4,000,000 bytes for the price array. That is
0.0058%. The bound is structural: the stack holds only running maxima seen from
the right, which for random data grows like `ln(n)`.

It is also, on random data, the fastest of the three in C++:

```
shape                    jumping      index stack    (price,span) stack
random 1..100000      11,846,250 ns   11,117,416 ns    10,377,541 ns
random 1..4            9,694,500 ns    9,217,708 ns     8,677,583 ns
strictly increasing    3,883,917 ns    2,068,291 ns     4,440,000 ns
strictly decreasing      796,875 ns    1,443,000 ns     3,479,042 ns
all equal              3,891,292 ns    2,073,417 ns     4,438,542 ns
```

Best of eleven runs, each shape measured in both orders. On the two random
shapes the pair stack wins by about 7%, because the comparison reads the price
straight out of the stack element instead of indirecting through the price
array. On the degenerate shapes it loses: at depth 1 the indirection is free —
always the same cache line — and the wider stack elements are pure overhead.

**And the advantage does not transfer to Python.** At n = 300,000 with random
prices the index stack takes 64.1ms and the pair stack 77.6ms, because
allocating a tuple per push costs more than the saved indirection. This is the
same shape of finding as Trapping Rainwater's vectorization result: a speedup
that comes from memory layout belongs to the platform, while a speedup that
comes from doing less work travels. The pair stack's *memory* advantage travels;
its speed advantage does not.

## What to write

For a streaming service, the `(price, span)` stack — it is the only one of the
three that does not require unbounded retained history, and that is a
correctness property, not an optimisation. For a one-shot array where the prices
are already in memory, the index stack, which is never worse than 1.4x the best
on any shape measured and is the simplest to get right.

<!-- @intuition -->
The span is a distance, not a count: `span[i] = i - prevGreater(i)`. That makes it the previous-greater-element query this topic has built twice already — except that here the prices arrive one at a time, so no right-to-left pass is available. The measured point of the subtopic is that this costs nothing, because the monotonic stack writes each answer once from information it already holds and never revises it.

<!-- @approach -->
### Brute force — walk backwards until a greater price appears

<!-- @idea -->
Apply the definition directly. For each day, step back through earlier days while their prices are at most today's, counting as you go. Correct by construction, online, and with a cost that varies by a factor of six thousand depending on the shape of the input.

<!-- @steps -->
```
1. For each day i, set span = 1.
2. Step j backwards from i-1 while j >= 0 and p[j] <= p[i], incrementing span.
3. Record span for day i.
4. The <= is from the problem statement, not a choice.
```

<!-- @complexity -->
- time: O(n^2) worst case, but O(n) on prices with short spans — the walk stops at the first greater price
- space: O(1) beyond the output
- note: Measured at n = 50,000 against the stack: 2x on random prices in 1..100000, 384x on random prices in 1..4, 6,193x on strictly increasing input and 6,229x on all-equal input — and 1x on strictly decreasing input, where it is actually *faster* than the stack at 43,709ns against 67,042ns because every span is 1 and the stack pays for a push it never gets to pop. A six-thousand-fold spread across inputs of identical size, with the smallest ratio on the input a benchmark would pick.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> stockSpan(const vector<int>& p) {
    int n = p.size();
    vector<int> span(n);

    for (int i = 0; i < n; i++) {
        int k = 1;
        for (int j = i - 1; j >= 0 && p[j] <= p[i]; j--) k++;   // stops at the first greater price
        span[i] = k;
    }
    return span;
}
```

<!-- @annotations -->
- 10: `p[j] <= p[i]`, not `<`. The span is defined over days at prices less than or *equal* to today's, so the tie handling is given by the statement rather than chosen — using < is wrong on 71.73% of series. The early exit on the first greater price is also what makes this fast on random prices and catastrophic on tied or rising ones: at prices drawn from 1..100000 the expected span is about 2, so the loop body almost never runs.
- 9: This version is still online — day i's answer depends only on days before it — which is worth noticing, since being online is not what separates the approaches here.

<!-- @code java -->
```java
static int[] stockSpan(int[] p) {
    int n = p.length;
    int[] span = new int[n];

    for (int i = 0; i < n; i++) {
        int k = 1;
        for (int j = i - 1; j >= 0 && p[j] <= p[i]; j--) k++;
        span[i] = k;
    }
    return span;
}
```

<!-- @annotations -->
- 7: The `j >= 0` bound must come first in the && so the short-circuit prevents an out-of-bounds read at j = -1; Java would throw rather than read garbage, but the ordering is the same discipline either way. Note also that this walks backwards over a forward-laid-out array, so on the inputs where it runs long it is reading against the prefetcher, compounding the algorithmic cost.
- 3: new int[n] zero-fills, which is harmless here because every entry is assigned unconditionally on line 8.

<!-- @code python -->
```python
def stock_span(p: list[int]) -> list[int]:
    n = len(p)
    span = [0] * n
    for i in range(n):
        k = 1
        j = i - 1
        while j >= 0 and p[j] <= p[i]:
            k += 1
            j -= 1
        span[i] = k
    return span
```

<!-- @annotations -->
- 7: Written as an explicit while rather than a comprehension, because the early termination is the entire behaviour under discussion and a comprehension would hide it.
- 4: Used here only as the cross-checking reference: 50,000 randomised series in C++ and 20,000 in Python, against which all three linear methods returned 0 mismatches.
- 3: [0] * n pre-sizes the list in C, which is faster than appending and makes the assignment on line 10 a plain store.

<!-- @approach -->
### Span jumping — no stack, but unbounded read distance

<!-- @idea -->
Use the spans already computed to leap backwards instead of walking. If day `i - span[i]` has a price at most today's, its own span covers a whole block that is already known to be no taller, so add that block in one step. No auxiliary container, and still online — every value read has already been produced.

<!-- @steps -->
```
1. span[i] = 1.
2. While i - span[i] >= 0 and p[i - span[i]] <= p[i]:
3.   span[i] += span[i - span[i]]     (skip the whole block in one step)
4. Each jump lands on the previous-greater candidate of the block just skipped.
```

<!-- @complexity -->
- time: O(n) amortised — measured 1.00 jump steps per element on every shape except strictly decreasing, which needs none
- space: O(n) for the span array, which is also the output — no extra container
- note: The step count is the same as the stack's pop count; the difference is distance. Measured total jump distance per element: 11.2 on random prices in 1..100000, but 24,983.7 on prices in 1..4 and 99,999.5 on strictly increasing or all-equal input, where each read lands about n/2 elements back and misses cache. That is why it takes 3,883,917ns on increasing input against the index stack's 2,068,291ns for identical nominal work. It is fastest of the three on strictly decreasing prices (796,875ns), where it makes no jumps at all.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> stockSpan(const vector<int>& p) {
    int n = p.size();
    vector<int> span(n);

    for (int i = 0; i < n; i++) {
        span[i] = 1;
        while (i - span[i] >= 0 && p[i - span[i]] <= p[i])
            span[i] += span[i - span[i]];       // skip a whole known block
    }
    return span;
}
```

<!-- @annotations -->
- 10: The bound check `i - span[i] >= 0` must be evaluated before the array read, and it changes every iteration because span[i] grows inside the loop — this is not a loop-invariant test.
- 11: Two reads at the same far-away offset: p[i - span[i]] and span[i - span[i]]. On increasing prices that offset averages about n/2, so both are cache misses, which is the entire performance story of this approach.
- 9: span[i] is initialised to 1 and then grown in place, so the array being written is also the array being read — correct here only because every index read is strictly less than i and therefore already final.

<!-- @code java -->
```java
static int[] stockSpan(int[] p) {
    int n = p.length;
    int[] span = new int[n];

    for (int i = 0; i < n; i++) {
        span[i] = 1;
        while (i - span[i] >= 0 && p[i - span[i]] <= p[i])
            span[i] += span[i - span[i]];
    }
    return span;
}
```

<!-- @annotations -->
- 8: Java's bounds checking makes the far reads slightly more expensive again, since each one carries a check the JIT cannot hoist out — the index depends on a value written in the same loop.
- 3: new int[n] then immediately overwritten at line 6; the zero-fill is wasted work here but not measurable against the cache misses that follow.
- 6: Setting span[i] = 1 before the loop rather than using a local and storing once is deliberate: the loop reads span[i] on every iteration, so it has to be in the array.

<!-- @code python -->
```python
def stock_span(p: list[int]) -> list[int]:
    n = len(p)
    span = [0] * n
    for i in range(n):
        span[i] = 1
        while i - span[i] >= 0 and p[i - span[i]] <= p[i]:
            span[i] += span[i - span[i]]
    return span
```

<!-- @annotations -->
- 6: The `i - span[i] >= 0` guard is not optional in Python either — a negative index would silently wrap to the end of the list and read a price from the future rather than raising.
- 7: Measured 90.9ms at n = 300,000 with random prices, the slowest of the three in Python as well as the slowest on most shapes in C++.
- 5: This is the one approach here that produces the whole span array as its natural output rather than a stream of answers, which is what makes it attractive when the array is what you wanted anyway.

<!-- @approach -->
### Monotonic stack of indices

<!-- @idea -->
Keep a stack of indices whose prices strictly decrease from bottom to top. When a new price arrives, pop every entry at a price at most today's — they can never be anyone's previous-greater again — and whatever remains on top is exactly `prevGreater(i)`. The span is the index difference.

<!-- @steps -->
```
1. While the stack is non-empty and p[stack.top()] <= p[i], pop.
2. span[i] = i - stack.top(), or i + 1 if the stack is now empty.
3. Push i.
4. Each index is pushed once and popped at most once, so the total is O(n).
```

<!-- @complexity -->
- time: O(n) amortised — measured 199,984 pops over 200,000 elements, 1.00 per element
- space: O(n) worst case for the stack, plus the retained price array it indexes into. Measured peak depth 30 of 200,000 on random prices (0.01%) but 200,000 of 200,000 on strictly decreasing prices.
- note: 11,117,416ns at n = 1,000,000 on random prices, and never worse than 1.4x the best of the three on any shape measured — the most consistent of the three and the simplest to get right. It is the fastest by a wide margin on the shapes that defeat the others: 2,068,291ns on strictly increasing input against span jumping's 3,883,917ns. In Python it is the fastest on every shape tested.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> stockSpan(const vector<int>& p) {
    int n = p.size();
    vector<int> span(n), st;                  // st holds indices, prices strictly decreasing
    st.reserve(n);

    for (int i = 0; i < n; i++) {
        while (!st.empty() && p[st.back()] <= p[i]) st.pop_back();
        span[i] = st.empty() ? i + 1 : i - st.back();
        st.push_back(i);
    }
    return span;
}
```

<!-- @annotations -->
- 10: `<=` pops the ties. A day at exactly today's price is counted by today's span, so it must not survive as a previous-greater — using < is wrong on 71.73% of series, with [1,1] as the smallest counterexample.
- 11: i + 1 when the stack empties, because there is no earlier greater price and the span reaches all the way back to day 0 inclusive. Writing i here is the classic off-by-one.
- 12: Push after computing the span, never before, or day i would find itself on the stack and report a span of 0.
- 6: The stack holds indices, so this version must retain the entire price array to read p[st.back()]. The (price, span) variant below removes that requirement entirely.
- 7: reserve(n) because the worst case really is n — strictly decreasing prices never pop, and that shape measured a peak depth of 200,000 out of 200,000.

<!-- @code java -->
```java
static int[] stockSpan(int[] p) {
    int n = p.length;
    int[] span = new int[n];
    int[] st = new int[n];                    // manual stack: no boxing
    int top = -1;

    for (int i = 0; i < n; i++) {
        while (top >= 0 && p[st[top]] <= p[i]) top--;
        span[i] = (top < 0) ? i + 1 : i - st[top];
        st[++top] = i;
    }
    return span;
}
```

<!-- @annotations -->
- 4: An int[] with an explicit top index rather than a Deque<Integer>, which would box every index; the manual stack costs three extra lines and removes an allocation per push.
- 8: `top--` is the pop and it does not clear the slot, which is correct because a slot is only ever read below the current top.
- 10: `st[++top] = i` pre-increments, so top ends up pointing at the element just written — pairing that with the `top >= 0` test on line 8 is what keeps the two consistent.

<!-- @code python -->
```python
def stock_span(p: list[int]) -> list[int]:
    span = []
    st: list[int] = []                        # indices, prices strictly decreasing

    for i, x in enumerate(p):
        while st and p[st[-1]] <= x:
            st.pop()
        span.append(i + 1 if not st else i - st[-1])
        st.append(i)

    return span
```

<!-- @annotations -->
- 6: The emptiness test comes first so short-circuiting prevents the IndexError — the same pattern as every other monotonic stack in this topic.
- 8: The conditional expression handles the empty stack inline; note it is `i + 1` and not `i`, since day 0 is included in the span.
- 11: Measured 64.1ms at n = 300,000 with random prices — the fastest of the three in Python, where the (price, span) variant loses to it because allocating a tuple per push costs more than the indirection it saves.

<!-- @approach -->
### Stack of (price, span) pairs — the streaming answer

<!-- @idea -->
Push the price and its span together, and accumulate the popped spans instead of doing index arithmetic. The result is that the price history is never read again — the algorithm retains only its own stack, which makes it usable as a service that answers one price at a time without storing the stream.

<!-- @steps -->
```
1. span = 1.
2. While the stack is non-empty and stack.top().price <= price:
3.   span += stack.top().span; pop.
4. Push (price, span) and return span.
```

<!-- @complexity -->
- time: O(1) amortised per query — each pair is pushed once and popped at most once
- space: O(k) where k is the number of running maxima currently held, and **nothing else**. Measured peak depth 29 entries — 232 bytes — at n = 1,000,000 random prices, against 4,000,000 bytes for the price array the index version must retain. That is 0.0058%.
- note: The fastest of the three in C++ on both random shapes — 10,377,541ns against the index stack's 11,117,416ns at n = 1,000,000, a 7% win from reading the price out of the stack element instead of indirecting through the array. It loses on degenerate shapes, where the stack is depth 1 and the indirection was free anyway. The speed advantage does not survive into Python (77.6ms against 64.1ms, because of the tuple allocation per push); the memory advantage does, and is the actual reason to choose it.

<!-- @code cpp -->
```cpp
#include <utility>
#include <vector>
using namespace std;

class StockSpanner {
    vector<pair<int, int>> st;                // (price, span) — no price history kept

public:
    int next(int price) {
        int span = 1;
        while (!st.empty() && st.back().first <= price) {
            span += st.back().second;         // absorb the whole block
            st.pop_back();
        }
        st.push_back({price, span});
        return span;
    }
};
```

<!-- @annotations -->
- 6: This is the whole point: no array of past prices, no indices into one. The object's entire state is this stack, measured at 232 bytes for a million-price stream.
- 9: Each call returns a final answer that is never revised, which is what makes this legal as an online service rather than merely an array algorithm run incrementally.
- 11: `<=` again, and note that popping an equal price is not merely allowed but required — its days belong to today's span.
- 12: Absorbing the popped entry's span is what replaces `i - st.back()`. The popped block is already known to be no taller than today, so its span transfers wholesale.
- 15: Push after the loop with the accumulated span, so the entry that remains represents the whole merged block rather than just today.

<!-- @code java -->
```java
import java.util.Arrays;

class StockSpanner {
    private int[] price = new int[16];        // parallel arrays, grown on demand
    private int[] span  = new int[16];
    private int top = -1;

    public int next(int p) {
        int s = 1;
        while (top >= 0 && price[top] <= p) {
            s += span[top];
            top--;
        }
        if (++top == price.length) {
            price = Arrays.copyOf(price, top * 2);
            span  = Arrays.copyOf(span,  top * 2);
        }
        price[top] = p;
        span[top] = s;
        return s;
    }
}
```

<!-- @annotations -->
- 4: Two parallel int arrays rather than a Deque of objects, which keeps both fields unboxed and contiguous — the Java equivalent of the C++ vector<pair<int,int>>.
- 11: The accumulate-then-pop order matters: span[top] must be read before top is decremented, or the value absorbed belongs to the wrong entry.
- 15: Doubling on demand rather than pre-sizing to the problem's stated call limit. A fixed cap is a common shortcut that silently corrupts memory on the one input exceeding it, which is the wrong failure mode for a service.
- 19: The two stores after the growth check are the push; keeping them separate from the growth logic makes the index discipline visible.

<!-- @code python -->
```python
class StockSpanner:
    def __init__(self):
        self.st: list[tuple[int, int]] = []   # (price, span)

    def next(self, price: int) -> int:
        span = 1
        while self.st and self.st[-1][0] <= price:
            span += self.st[-1][1]
            self.st.pop()
        self.st.append((price, span))
        return span
```

<!-- @annotations -->
- 7: Reading self.st[-1] twice on consecutive lines costs two index operations; binding it once to a local is marginally faster and is worth doing in a hot CPython loop.
- 10: The tuple allocation on every push is why this measures 77.6ms at n = 300,000 against the index stack's 64.1ms — the opposite of the C++ ordering, and a reminder that a memory-layout win belongs to the platform.
- 3: The memory argument is unaffected by that: this object holds about 30 tuples for a million-price stream, where the index version needs every price forever.

<!-- @example -->

<!-- @input -->
```
prices = [100, 80, 60, 70, 60, 75, 85]
```

<!-- @output -->
```
spans = [1, 1, 1, 2, 1, 4, 6]
```

<!-- @why -->
The canonical case, and the one that makes the amortised argument visible. Day 6's span of 4 requires two pops and day 7's span of 6 requires two more — a single query can pop many entries, yet the whole series costs seven pushes and four pops in total. The work per query is unbounded; the work per element is not.

<!-- @walkthrough -->
- 100 arrives on an empty stack: span 1, stack holds [100].
- 80 and 60 each find a greater price on top and pop nothing: spans 1 and 1, stack [100, 80, 60].
- 70 pops the 60 — it can never be anyone's previous-greater again — leaving 80 on top, so span = 4 - 2 = 2 and the stack is [100, 80, 70].
- 60 pops nothing: span 1, stack [100, 80, 70, 60].
- 75 pops [60, 70] and stops at 80, so span = 6 - 2 = 4 and the stack is [100, 80, 75].
- 85 pops [75, 80] and stops at 100, so span = 7 - 1 = 6 and the stack is [100, 85].
- Total across the series: 7 pushes and 4 pops. Two of the seven queries did all the popping, which is exactly what amortised O(1) looks like from the inside.

<!-- @example -->

<!-- @input -->
```
prices = [1, 1]
```

<!-- @output -->
```
spans = [1, 2]   (popping on < instead of <= gives [1, 1])
```

<!-- @why -->
The two-element counterexample for the one tie convention, found by exhaustive enumeration over all price vectors of length 1 to 4 drawn from {1,2}. The span counts days at prices **less than or equal to** today's, so an equal earlier price belongs to today's span and must be popped. Popping only on strict inequality leaves it on the stack as a false previous-greater, which is wrong on **71.73%** of random series.

<!-- @walkthrough -->
- Day 1: the stack is empty, so span = 1 and index 0 is pushed.
- Day 2 with `<=`: p[0] = 1 <= 1, so index 0 pops. The stack is now empty, so span = i + 1 = 2. Correct.
- Day 2 with `<`: p[0] = 1 < 1 is false, so nothing pops. Index 0 remains as the previous-greater, giving span = 1 - 0 = 1. Wrong.
- The definition settles it — there is no design freedom here, unlike the previous two subtopics.
- Trapping Rainwater accepted all four tie conventions because a tie contributes zero water; Largest Rectangle accepted three of four because it takes a maximum; here exactly one is correct because the answer's definition names the tie.
- The failure needs only two equal adjacent prices, which is why it fires on nearly three quarters of random series rather than in a corner.

<!-- @example -->

<!-- @input -->
```
50,000 prices, holding the length fixed and varying only the shape
```

<!-- @output -->
```
the brute force ranges from 1x to 6,229x the stack — and is 2x on random data
```

<!-- @why -->
The measurement that decides whether the stack is worth writing, and it shows that the usual benchmark cannot tell. On random prices drawn from 1..100000 the expected span is about 2, so the backward walk almost never runs and the quadratic algorithm reports a 2x constant factor. Narrowing the value range or sorting the input moves it by three orders of magnitude without changing the input size at all.

<!-- @walkthrough -->
- Random prices in 1..100000: brute 974,875ns against the stack's 560,833ns — a 2x ratio that reads as a constant factor.
- Strictly decreasing prices: brute 43,709ns against the stack's 67,042ns. The brute force actually *wins*, because every span is 1 so it does one comparison per day while the stack pays for a push it never gets to pop.
- Random prices in 1..4: brute 167,784,000ns against 436,958ns — 384x. Nothing grew; ties simply became common and spans became long.
- Strictly increasing prices: 647,156,833ns against 104,500ns — 6,193x.
- All prices equal: 650,942,333ns against 104,500ns — 6,229x, the extreme.
- The spread is about six thousand-fold across inputs of identical size, and the shape that produces the smallest ratio is the one a benchmark would reach for first.

<!-- @example -->

<!-- @input -->
```
a stream of 1,000,000 prices delivered one at a time
```

<!-- @output -->
```
the (price, span) stack retains 232 bytes; the index stack needs all 4,000,000
```

<!-- @why -->
The reason the pair-stack formulation exists. Storing indices means the price array must be kept forever so that `p[stack.top()]` can be read; storing the price alongside its span means the stack is the entire state. Measured peak depth on random prices was 29 entries, because the stack holds only running maxima seen from the right — a count that grows like `ln(n)`, not like `n`.

<!-- @walkthrough -->
- The index version reads `p[st.back()]` on every comparison, so every price ever seen must remain addressable: 4,000,000 bytes for a million 32-bit prices.
- The pair version compares against `st.back().first`, which is in the stack element itself, so nothing else is retained.
- Measured peak stack depth at n = 1,000,000 random prices: 29 entries of 8 bytes each — 232 bytes, or 0.0058% of the price array.
- That bound is structural rather than lucky: an entry survives only while no later price has matched or exceeded it, so the depth is the number of running maxima from the right.
- The worst case is still O(n) — strictly decreasing prices never pop anything and the stack reaches 200,000 of 200,000 — but that is the price series in which nothing interesting is happening.
- In C++ the pair version is also 7% faster on random data (10,377,541ns against 11,117,416ns) because it avoids the indirect load; in Python it is 21% slower because of the tuple allocation per push. The memory argument holds in both.

<!-- @visualization stack -->

<!-- @description -->
Open by defining the span twice, because the second definition is the one that solves it. First draw the seven prices as a bar chart and, for a chosen day, sweep a highlighter leftwards over the bars that are no taller than it, counting — that is the span as a count. Then redraw the same picture with a single arrow leaping from today straight back to the first strictly taller bar, labelled `span = i - prevGreater(i)` — the span as a distance. Caption: "a count you walk is a distance you can look up". Then run the stack on all seven prices with the stack drawn as a vertical column beside the chart, its entries strictly decreasing. On each arrival, flash the entries that pop and show them being absorbed. Put two counters on screen throughout — total pushes and total pops — and let them finish at 7 and 4, captioned "two of the seven queries did all the popping: that is amortised O(1) from the inside". Next the streaming panel, which is the heart of it. Show two lanes side by side receiving the same one-at-a-time price feed. The index lane keeps a growing grey archive of every price ever seen, with an arrow reaching back into it on every comparison; the pair lane has no archive at all, and its comparison arrow stops inside the stack element. Run both to a million prices with a byte counter under each: 4,000,000 versus 232. Then the shape panel as a 2x2 grid of price series — random wide, random narrow, strictly increasing, strictly decreasing — each with the brute-force and stack times beside it: 2x, 384x, 6,193x, and 1x with the brute force winning. Draw the 1x cell in green with a small trophy on the brute force, and the 6,193x cell with its bar running off the edge. Caption: "same length, six thousand-fold spread, and the input you would benchmark with is the 2x one". Close with the span-jumping comparison: the same price series with an arrow that leaps backwards by whole blocks, a step counter that ticks at exactly the same rate as the stack's pop counter, and a distance counter that races to 99,999 per element on rising prices while the stack's read stays pinned to its own top — labelled "same steps, unbounded reach".

<!-- @sampleInput -->
```json
{"problem":{"prices":[100,80,60,70,60,75,85],"spans":[1,1,1,2,1,4,6],"definition":"the number of consecutive days up to and including today on which the price was less than or equal to today's price"},"reframing":{"formula":"span[i] = i - prevGreater(i)","prevGreater":"index of the nearest earlier day with a STRICTLY greater price, or -1","point":"a count you walk is a distance you can look up, and previous-greater-element is already built"},"online":{"constraint":"each span must be returned before the next price is revealed","rulesOut":["any right-to-left pass","precomputed suffix arrays","the row-carrying DP that beat the stack in Maximum Rectangles"],"measuredCost":"nothing — the monotonic stack writes each answer once from information it already holds and never revises it, so the optimal offline algorithm is already legal online","contrastWithPreviousSubtopic":"in Maximum Rectangles the extra structure of successive rows let a stackless DP beat the stack; here there is no extra structure, so the stack is unbeaten","topicRule":"the monotonic stack is the right answer exactly when the only structure available is the order of the elements, which is what an online stream gives you"},"trace":[{"price":100,"pops":[],"span":1,"stack":[100]},{"price":80,"pops":[],"span":1,"stack":[100,80]},{"price":60,"pops":[],"span":1,"stack":[100,80,60]},{"price":70,"pops":[60],"span":2,"stack":[100,80,70]},{"price":60,"pops":[],"span":1,"stack":[100,80,70,60]},{"price":75,"pops":[60,70],"span":4,"stack":[100,80,75]},{"price":85,"pops":[75,80],"span":6,"stack":[100,85]}],"amortised":{"totalPushes":7,"totalPops":4,"reading":"two of the seven queries did all the popping — work per query is unbounded, work per element is not","measuredAt200000":{"pops":199984,"perElement":1.0}},"tieConvention":{"required":"<=","wrongPct":71.73,"smallestCounterexample":{"prices":[1,1],"gives":[1,1],"correct":[1,2]},"why":"the definition names the tie — days at prices less than OR EQUAL to today's — so an equal earlier price belongs to today's span and must be popped","threeRegimes":{"trappingRainwater":"all four conventions correct, because a tie contributes zero water","largestRectangleInAHistogram":"three of four correct, because the answer is a maximum and duplicates are absorbed","stockSpan":"exactly one correct, because the answer's definition names the tie"}},"bruteForce":{"n":50000,"rows":[{"shape":"random 1..100000","bruteNs":974875,"stackNs":560833,"factor":2},{"shape":"strictly decreasing","bruteNs":43709,"stackNs":67042,"factor":1,"note":"the brute force WINS — every span is 1, so it does one comparison per day while the stack pays for a push it never pops"},{"shape":"random 1..4","bruteNs":167784000,"stackNs":436958,"factor":384},{"shape":"strictly increasing","bruteNs":647156833,"stackNs":104500,"factor":6193},{"shape":"all equal","bruteNs":650942333,"stackNs":104500,"factor":6229}],"lesson":"a six-thousand-fold spread across inputs of identical size, with the smallest ratio on the shape a benchmark would pick first"},"spanJumping":{"rule":"span[i] = 1; while i - span[i] >= 0 and p[i - span[i]] <= p[i]: span[i] += span[i - span[i]]","alsoOnline":true,"stepsPerElement":1.0,"weakness":"distance, not step count","distancePerElement":[{"shape":"random 1..100000","distance":11.2},{"shape":"random 1..4","distance":24983.7},{"shape":"strictly increasing","distance":99999.5},{"shape":"strictly decreasing","distance":0.0},{"shape":"all equal","distance":99999.5}],"consequence":"on rising or tied prices each read lands about n/2 elements back and misses cache, which is why it takes 3,883,917ns on increasing input against the index stack's 2,068,291ns for identical nominal work"},"timing":{"n":1000000,"note":"best of 11, each shape measured in both orders","rows":[{"shape":"random 1..100000","jumpingNs":11846250,"indexStackNs":11117416,"pairStackNs":10377541,"winner":"pair stack"},{"shape":"random 1..4","jumpingNs":9694500,"indexStackNs":9217708,"pairStackNs":8677583,"winner":"pair stack"},{"shape":"strictly increasing","jumpingNs":3883917,"indexStackNs":2068291,"pairStackNs":4440000,"winner":"index stack"},{"shape":"strictly decreasing","jumpingNs":796875,"indexStackNs":1443000,"pairStackNs":3479042,"winner":"span jumping"},{"shape":"all equal","jumpingNs":3891292,"indexStackNs":2073417,"pairStackNs":4438542,"winner":"index stack"}],"python":{"n":300000,"randomPrices":{"jumpingMs":90.9,"indexStackMs":64.1,"pairStackMs":77.6},"reading":"the C++ pair-stack advantage inverts, because allocating a tuple per push costs more than the saved indirection — a memory-layout win belongs to the platform, while the memory-size win travels"}},"stackDepth":{"n":200000,"rows":[{"shape":"random 1..100000","depth":30,"pct":0.01,"popsPerElement":1.0},{"shape":"random 1..4","depth":4,"pct":0.0,"popsPerElement":1.0},{"shape":"strictly increasing","depth":1,"pct":0.0,"popsPerElement":1.0},{"shape":"strictly decreasing","depth":200000,"pct":100.0,"popsPerElement":0.0},{"shape":"all equal","depth":1,"pct":0.0,"popsPerElement":1.0}],"note":"the adversary here is DECREASING prices — nothing ever pops — which is the mirror of Largest Rectangle, where rising input filled the stack"},"memory":{"n":1000000,"indexStackRetains":"the full price array, 4000000 bytes, forever — p[stack.top()] must stay addressable","pairStackRetains":"only its own stack","measuredPeakPairDepth":29,"measuredPeakBytes":232,"pctOfPriceArray":0.0058,"whyBounded":"an entry survives only while no later price has matched or exceeded it, so the depth is the number of running maxima from the right, which grows like ln(n)"},"recommendation":{"streaming":"the (price, span) stack — the only one that needs no unbounded retained history, which is a correctness property rather than an optimisation","oneShotArray":"the index stack — never worse than 1.4x the best on any shape measured, and the simplest to get right"},"verification":{"cpp":{"series":50000,"maxN":14,"valueCaps":[2,4,20],"reference":"O(n^2) brute force","mismatches":0},"python":{"series":20000,"mismatches":0}}}
```

<!-- @highlights -->
- The span is defined twice: as a count you sweep, then as a single arrow leaping to the previous greater bar.
- The caption reads "a count you walk is a distance you can look up".
- The stack is drawn beside the price chart with entries strictly decreasing.
- Popped entries flash and are visibly absorbed into the arriving day's span.
- Push and pop counters run throughout and finish at 7 and 4.
- Their caption reads "two of the seven queries did all the popping".
- Two streaming lanes receive the same one-at-a-time price feed side by side.
- The index lane keeps a growing grey archive with an arrow reaching back into it every comparison.
- The pair lane has no archive, and its comparison arrow stops inside the stack element.
- Byte counters under each lane finish at 4,000,000 and 232.
- A 2x2 grid of price shapes shows brute-force ratios of 2x, 384x, 6,193x and 1x.
- The 1x cell is green with a trophy on the brute force, which genuinely wins there.
- The 6,193x cell has its bar running off the edge of the frame.
- Its caption notes the input you would benchmark with is the 2x one.
- A span-jumping lane leaps backwards by whole blocks with a step counter matching the stack's pop rate.
- A distance counter races to 99,999 per element on rising prices while the stack's read stays pinned to its top.

<!-- @edgeCases -->
- **A single day** — the span is 1. Every method handles it without a guard, since the stack is empty and `i + 1` is 1.
- **Two equal prices** — `[1,1]` gives `[1,2]`. The smallest input that catches a `<` where `<=` is required.
- **Strictly decreasing prices** — every span is 1, the stack reaches full depth `n` and never pops, and this is the one shape where the brute force is faster than the stack.
- **Strictly increasing prices** — every span is `i + 1`, the stack stays at depth 1, and the brute force is 6,193x slower.
- **All prices equal** — every span is `i + 1`, identical to strictly increasing from the algorithm's point of view, and the brute force's worst case at 6,229x.
- **The first day** — the stack is empty so the span is `i + 1 = 1`. Writing `i` instead of `i + 1` here is the classic off-by-one and only shows up on day 1 and after every new all-time high.
- **A new all-time maximum** — pops the stack completely, so the empty-stack branch fires. Not rare: it happens once per running maximum, about `ln(n)` times on random prices.
- **A very long run of equal prices** — each one pops the previous, so the stack stays at depth 1 while spans grow linearly. Cheap, not expensive.
- **Prices arriving indefinitely** — the index formulation cannot bound its memory, because the price array must stay addressable. The `(price, span)` formulation retains only running maxima.
- **Negative indices in span jumping** — `i - span[i]` must be bounds-checked before the read. In Python a negative index silently wraps to the end of the list and reads a price from the future rather than raising.
- **A fixed-size stack sized to the problem's stated call limit** — works until one extra call, then corrupts memory silently. Growable storage costs three lines.

<!-- @pitfalls -->
- **Popping on `<` instead of `<=`.** Wrong on 71.73% of random series, smallest counterexample `[1,1]`. The definition names the tie, so this is not a design choice.
- **Writing `span[i] = i` when the stack empties.** It is `i + 1`, because day 0 is inside the span. Only visible on day 1 and after each new all-time high.
- **Pushing before computing the span.** Day `i` would find itself on the stack and report a span of 0.
- **Benchmarking the brute force on random wide-range prices and concluding it is fine.** That is a 2x ratio. Narrow the range to 1..4 and it is 384x; sort the input and it is 6,193x.
- **Assuming the stack always beats the brute force.** On strictly decreasing prices the brute force wins, 43,709ns against 67,042ns, because every span is 1 and the stack pays for pushes it never pops.
- **Choosing span jumping because it avoids the extra container.** It performs the same 1.00 steps per element but reads at unbounded distance — 99,999 elements back per step on rising prices, against the stack's own hot top.
- **Forgetting the bounds check in span jumping.** `i - span[i]` goes negative, and in Python that wraps to the end of the list and reads a future price rather than raising.
- **Storing indices when the input is a stream.** The price array must then be retained forever. The `(price, span)` form retains 232 bytes where the index form needs 4,000,000.
- **Sizing the streaming stack to the stated maximum number of calls.** A fixed cap fails silently on the one input that exceeds it, which is the worst failure mode for a long-running service.
- **Assuming the C++ pair-stack speed advantage transfers.** It is 7% faster than the index stack in C++ and 21% slower in Python, where the tuple allocation dominates. The memory advantage transfers; the speed one does not.
- **Boxing the stack entries in Java.** `Deque<Integer>` allocates per push; two parallel `int[]` arrays with an explicit top keep everything unboxed and contiguous.
- **Reading `stack.top()` twice on consecutive lines in Python.** Binding it to a local once is measurably cheaper in a hot loop and reads no worse.

<!-- @doubt -->
Why is the span better thought of as a distance than as a count?

<!-- @answer -->
Because a count has to be produced by walking, and a distance can be produced by a lookup. `span[i]` is the number of consecutive days back to but not including the first strictly greater price — which is exactly `i - prevGreater(i)`. Once it is written that way, the problem stops being new: previous-greater-element is the query this topic has already solved twice with a monotonic stack. That reframing is also what makes the amortised argument available. Counted directly, one query can cost `O(n)`; expressed as a distance, the stack that answers it does one push and at most one pop per element for the whole series, regardless of how expensive any individual query looks.

<!-- @doubt -->
What does the online constraint actually cost here?

<!-- @answer -->
Nothing, and that is the measured point of the subtopic. The monotonic stack computes `span[i]` entirely from state it already holds, writes it once, and never revises it — so the algorithm that would be optimal with the whole array in hand is already legal one price at a time. There is no better offline method being given up. Compare the previous subtopic: in Maximum Rectangles the offline structure of successive rows let a stackless DP carry boundary information forward and beat the stack at nearly every density. The difference is whether the problem offers structure beyond element order. A stream offers exactly element order, which is precisely the situation where a monotonic stack is the right answer.

<!-- @doubt -->
How can the brute force be only 2x slower if it is quadratic?

<!-- @answer -->
Because the backward walk stops at the first greater price, and on random prices that happens almost immediately. With prices drawn from 1..100000 the expected span is about 2, so the inner loop runs about once and the algorithm is effectively linear. The quadratic term needs long spans, which need ties or a rising trend. Measured at n = 50,000: 2x on random wide prices, 384x on prices drawn from 1..4, 6,193x on strictly increasing input and 6,229x on all-equal input. Same length, roughly six-thousand-fold spread. This is the same hazard shape as the previous subtopic's height rebuild — a cost that depends on a property of the data rather than its size — and the same remedy applies: test the extreme of that property deliberately, because random input will not find it.

<!-- @doubt -->
The brute force actually beats the stack on decreasing prices. Is that real?

<!-- @answer -->
Yes — 43,709ns against 67,042ns at n = 50,000, and the reason is straightforward. On strictly decreasing prices every span is 1, so the brute force does exactly one comparison per day and stops. The stack does one comparison, one push, and grows to depth `n` without ever popping anything, so it pays full bookkeeping cost for zero benefit. It is worth stating because it is the honest boundary of the claim: the stack's advantage is amortisation, and amortisation buys nothing on an input where the naive method never repeats work. It also happens to be the input where the stack's memory is worst, at 200,000 entries out of 200,000.

<!-- @doubt -->
Span jumping does the same number of steps as the stack. Why is it slower?

<!-- @answer -->
Because the steps are not the same size. Measured at n = 200,000, span jumping performs 1.00 jump steps per element and the stack performs 1.00 pops per element — identical operation counts. What differs is where the memory reads land. The stack reads `p[st.back()]`, and its top is the most recently touched entry, so it is always in L1. Span jumping reads `p[i - span[i]]` and `span[i - span[i]]`, and on rising or tied prices that offset averages about `n/2` — measured total jump distance of 99,999.5 per element on strictly increasing input against 11.2 on random wide prices. Every one of those is a cache miss. The result is 3,883,917ns against the stack's 2,068,291ns for nominally identical work.

<!-- @doubt -->
Is span jumping ever the right choice?

<!-- @answer -->
On strictly decreasing prices it is the fastest of the three by a wide margin — 796,875ns against the index stack's 1,443,000ns — because it makes no jumps at all and needs no auxiliary container. More usefully, it is the natural formulation when the whole span array is the desired output anyway, since it writes directly into that array with no second structure. But those are narrow cases. On random prices it is the slowest of the three in both C++ and Python, and its worst-case locality is unbounded where the stack's is not. Learn it as a technique — using already-computed results to skip known blocks generalises well — and reach for the stack in practice.

<!-- @doubt -->
Why does storing `(price, span)` pairs let you drop the price history?

<!-- @answer -->
Because the only thing the price array was ever used for was the comparison `p[st.back()] <= p[i]`, and putting the price into the stack element answers that in place. The index arithmetic `i - st.back()` is then replaced by accumulating the popped spans, which works because a popped block is already known to be no taller than today, so its entire span transfers wholesale. The consequence is that the algorithm's state is exactly its stack. Measured at n = 1,000,000 random prices, the peak was 29 entries — 232 bytes — against 4,000,000 bytes of prices the index version must keep addressable. For a service that runs indefinitely, that is not an optimisation; it is the difference between bounded and unbounded memory.

<!-- @doubt -->
Why is the stack only about 29 entries deep on a million prices?

<!-- @answer -->
Because an entry survives only while no later price has matched or exceeded it, so the stack holds exactly the running maxima of the sequence read from the right. For random data the expected number of such records grows like `ln(n)`, not like `n` — the same harmonic-number argument as the min stack's occupancy in Implement Min Stack, which measured 12 entries per 200,000 pushes. The worst case is still `O(n)`, and strictly decreasing prices hit it exactly: nothing ever pops and the depth reaches 200,000 of 200,000. But that is the sequence where every span is 1 and nothing is happening. On any price series with occasional rises the stack stays small.

<!-- @doubt -->
The pair stack is faster in C++ and slower in Python. Which result should I believe?

<!-- @answer -->
Both, and neither should drive the decision. In C++ it wins 7% on random prices because the comparison reads the price out of the stack element instead of indirecting through the array; in Python it loses 21% because allocating a tuple per push costs more than the indirection saved. That is the same shape as Trapping Rainwater's vectorization result — a speedup arising from memory layout is a property of the platform, not the algorithm, and it does not travel. What does travel is the memory *size* argument: 232 bytes of retained state against 4,000,000, in any language. Choose the pair stack for streaming because of what it does not retain, and treat its speed as a wash.

<!-- @doubt -->
This is a third different answer about tie conventions in three subtopics. Is there a rule?

<!-- @answer -->
Yes, and this subtopic completes it. Trapping Rainwater accepted all four strict/non-strict combinations, because a tie contributes exactly zero water. Largest Rectangle accepted three of four, because the answer is a maximum and duplicate claims are absorbed — only total absence of coverage hurts. Here exactly one is correct, because the definition of the answer names the tie: "days at prices less than or equal to today's". The rule is the one stated in the previous subtopic — a tie convention matters exactly as much as the tied element's contribution — with the addition that when the problem statement itself specifies the tie, there is no freedom left to reason about. Read the statement first; measure only where it is silent.
