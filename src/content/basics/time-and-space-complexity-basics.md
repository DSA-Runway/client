---
id: time-and-space-complexity-basics
topic: Basics
title: Time and Space Complexity Basics
difficulty: Hard
status: ready
prerequisites:
  - nested-loops
  - prime-check
  - gcd-euclidean-algorithm
  - count-digits
  - for-loop
relatedIds:
  - nested-loops
  - prime-check
  - gcd-euclidean-algorithm
  - count-digits
  - stack-memory-and-recursion-depth
---

<!-- @summary -->
Describing how an algorithm's cost grows with its input, so you can predict whether a solution will finish before you write it.

<!-- @theory -->
## Why not just time it?

Run the same code on two machines and you get two different numbers. Run it twice on
the *same* machine and you get two different numbers. A stopwatch measures your
hardware, your compiler, and what else was running — not your algorithm.

What you actually want to know is: **as the input grows, how does the work grow?**
That question has an answer independent of any machine, and it is what complexity
analysis measures.

## Counting operations

Count the steps as a function of the input size `n`.

```
for (int i = 0; i < n; i++)     // n iterations
    sum += arr[i];              // 1 operation each
```

That is `n` operations. Double the input, double the work. **Linear.**

```
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
        count++;
```

`n × n` operations. Double the input, **quadruple** the work. **Quadratic.**

We write these as **O(n)** and **O(n²)** — Big O notation, which describes how the
cost grows rather than what it is.

## Dropping constants and lower-order terms

Big O deliberately discards two things.

**Constants.** `3n` and `n` are both **O(n)**. A loop doing three operations per
iteration is three times slower than one doing one — but both double when the input
doubles, and that shared shape is what Big O captures.

**Lower-order terms.** `n² + n` is **O(n²)**. At n = 1000 the quadratic term is a
million and the linear term is a thousand — the smaller one stops mattering as n
grows.

**This discarding is a feature, not a loss of precision.** It isolates the property
that survives changing machines, and lets you compare algorithms without benchmarking.

It also has a limit worth stating plainly: **constant factors are real.** Prime Check
measured the 6k ± 1 refinement at **10,540 operations against 31,621** for the plain
square-root loop — a genuine 3× speedup, and both are O(√n). Big O calls them equal
because it is answering a different question.

## The classes you need

Ordered from fastest to slowest growing:

| Class | Name | Example |
|---|---|---|
| **O(1)** | Constant | Array index, arithmetic |
| **O(log n)** | Logarithmic | Binary search, GCD |
| **O(√n)** | Square root | Prime check |
| **O(n)** | Linear | Single pass over an array |
| **O(n log n)** | Linearithmic | Efficient sorting |
| **O(n²)** | Quadratic | Nested loops over the same data |
| **O(2ⁿ)** | Exponential | All subsets |
| **O(n!)** | Factorial | All permutations |

Computed operation counts:

| n | log₂ n | √n | n | n log₂ n | n² |
|---|---|---|---|---|---|
| 100 | 7 | 10 | 100 | 664 | 10,000 |
| 10,000 | 13 | 100 | 10,000 | 132,877 | 100,000,000 |
| 1,000,000 | 20 | 1,000 | 1,000,000 | 19,931,569 | **1,000,000,000,000** |

At a million elements, a linear algorithm does a million operations and a quadratic
one does a **trillion**. That is the difference between instant and never.

## Polynomial is not exponential

Worth repeating from the Nested Loops subtopic, because it is commonly said wrong.

Any fixed depth of nesting is **polynomial** — O(n²), O(n³), O(nᵏ). **Exponential**
means the exponent itself grows with n:

| n | n² | 2ⁿ |
|---|---|---|
| 10 | 100 | 1,024 |
| 30 | 900 | 1,073,741,824 |
| 60 | 3,600 | 1,152,921,504,606,846,976 |

At n = 60 the quadratic is trivial and the exponential exceeds anything computable.
Stacking loops never gets you to exponential.

## The rule that decides your algorithm

A rough but reliable heuristic: **a judge executes about 10⁸ operations per second.**

So the constraints in a problem statement tell you which complexities are viable.
Computed by solving each cost function against a 10⁸ budget:

| Complexity | Largest n finishing in ~1 second |
|---|---|
| O(n!) | **11** |
| O(2ⁿ) | **26** |
| O(n³) | **464** |
| O(n²) | **10,000** |
| O(n log n) | **4,523,071** |
| O(n) | **100,000,000** |

Read this backwards and it becomes a design tool:

- **n ≤ 10** — factorial is fine. Try every permutation.
- **n ≤ 20** — exponential is fine. Try every subset.
- **n ≤ 500** — cubic is fine.
- **n ≤ 5,000** — quadratic is fine.
- **n ≤ 10⁶** — you need O(n log n) or better.
- **n ≤ 10⁹** — you need O(log n) or O(√n).

**Read the constraints before writing code.** If n is 10⁵ and your idea is nested
loops, it will not pass, and you know that before typing a line. This is the single
most practical use of complexity analysis.

## Space complexity

The same idea applied to memory.

**O(1)** — a fixed number of variables, whatever the input size. The Count Digits
loop stores a counter and nothing else.

**O(n)** — memory proportional to the input. A copy of an array, a sieve, a hash set.

**O(log n)** — usually a recursion stack whose depth is logarithmic.

Two things people miss:

**Recursion is not free.** Every pending call holds a stack frame. The recursive Count
Digits uses **O(log n)** space where the loop uses O(1) — same time, different memory.

**Only count what you allocate.** The input itself is usually excluded, since you did
not choose to store it. That is why this is often called **auxiliary** space.

## Best, average, and worst case

Complexity depends on the input, not just its size.

Linear search over n items:

- **Best case**: found first. O(1).
- **Worst case**: absent, or last. O(n).
- **Average case**: about n/2 comparisons, which is O(n).

**Default to quoting the worst case.** It is the guarantee, and on a judge the tests
are chosen adversarially. Prime Check's worst case is a prime, since no early exit is
possible — that is exactly why the measurements used primes.

## Reading complexity off code

Four rules cover most cases:

**Sequential blocks add.** Two loops one after another over n is `n + n` = O(n), not
O(n²). Only **nesting** multiplies.

**Nested loops multiply.** A loop inside a loop, each over n, is O(n²).

**Halving is logarithmic.** If a value halves each iteration, the loop runs about
log₂ n times. Doubling is the same in reverse.

**Take the maximum.** A function that is O(n) then O(n²) is O(n²) overall.

Three worked cases from this module:

- **Count Digits** divides by 10 each step, so the loop runs once per digit —
  **O(log₁₀ n)**, bounded at 19 for a 64-bit integer.
- **GCD** reduces the pair substantially each step — **O(log min(a,b))**, measured at
  44 steps for the hardest pair below two billion.
- **Prime Check** tests up to √n — **O(√n)**, measured at 315 operations where the
  linear scan took 100,001.

## The trap this module has warned about twice

**A better complexity class is not automatically the better solution.**

Count Digits had an O(1) logarithm formula that was **wrong** above 10¹⁵, against an
O(log n) loop bounded at 19 iterations. The loop wins. Correctness first, and a
bounded loop is not a performance problem.

Complexity analysis tells you how cost **grows**. It does not tell you whether the
answer is right, whether n is large enough for growth to matter, or what the constant
factor is. Use it to rule out approaches that cannot possibly finish — that is what
it is genuinely excellent at.

<!-- @intuition -->
Complexity is not a measure of speed, it is a measure of how speed responds to size. A stopwatch tells you about your laptop; the growth rate tells you what happens when the input gets ten times bigger — which is the only question that survives changing machines.

<!-- @approach -->
### Counting Operations as a Function of Input Size

<!-- @idea -->
Express the number of steps in terms of n, then name the shape of that expression.

<!-- @steps -->
1. Identify what n represents — the array length, the value of a number, the number of nodes.
2. Count how many times the innermost operation executes, as an expression in n.
3. Check how that expression responds when n doubles.
4. Name the growth: unchanged is constant, doubled is linear, quadrupled is quadratic.
5. Write it in Big O notation, which describes the growth rather than the exact count.

<!-- @code cpp -->
```cpp
// O(1) — constant. The work does not depend on n at all.
int first(vector<int>& arr) {
    return arr[0];
}

// O(n) — linear. One pass, one operation per element.
int sum(vector<int>& arr) {
    int total = 0;
    for (int x : arr) total += x;     // n iterations
    return total;
}

// O(n^2) — quadratic. Every element paired against every element.
int countPairs(vector<int>& arr) {
    int n = arr.size(), count = 0;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)   // n x n iterations
            if (arr[i] + arr[j] == 10) count++;
    return count;
}

// O(log n) — logarithmic. The value halves every iteration.
int halvings(int n) {
    int steps = 0;
    while (n > 1) { n /= 2; steps++; }   // about log2(n) iterations
    return steps;
}

// Doubling n:  O(1) unchanged | O(n) doubles | O(n^2) quadruples
//              O(log n) adds exactly one iteration
```

<!-- @annotations -->
- 8: n iterations of one operation. Double the array and the loop body runs twice as often.
- 16: The nesting is what multiplies. Two loops side by side would still be O(n).
- 25: The clearest test of a logarithm: doubling the input adds one step, not double the steps.

<!-- @code java -->
```java
// O(1)
static int first(int[] arr) { return arr[0]; }

// O(n)
static int sum(int[] arr) {
    int total = 0;
    for (int x : arr) total += x;
    return total;
}

// O(n^2)
static int countPairs(int[] arr) {
    int count = 0;
    for (int i = 0; i < arr.length; i++)
        for (int j = 0; j < arr.length; j++)
            if (arr[i] + arr[j] == 10) count++;
    return count;
}

// O(log n)
static int halvings(int n) {
    int steps = 0;
    while (n > 1) { n /= 2; steps++; }
    return steps;
}

// halvings(1000) returns 9; halvings(2000) returns 10.
// Doubling the input added ONE step. That is what logarithmic means.
```

<!-- @annotations -->
- 27: The most concrete way to recognise a logarithm in the wild.

<!-- @code python -->
```python
# O(1)
def first(arr):
    return arr[0]

# O(n)
def total(arr):
    s = 0
    for x in arr:
        s += x
    return s

# O(n^2)
def count_pairs(arr):
    count = 0
    for i in range(len(arr)):
        for j in range(len(arr)):
            if arr[i] + arr[j] == 10:
                count += 1
    return count

# O(log n)
def halvings(n):
    steps = 0
    while n > 1:
        n //= 2
        steps += 1
    return steps

print(halvings(1000))    # 9
print(halvings(2000))    # 10  — doubled the input, added one step
print(halvings(10**6))   # 19

# Careful: some Python built-ins hide their cost.
# 'x in a_list' is O(n). 'x in a_set' is O(1).
# The syntax is identical and the complexity is not.
```

<!-- @annotations -->
- 30: A million-element input needs only 19 halvings, which is why logarithmic algorithms scale so well.
- 34: A genuine trap in Python — identical-looking code with completely different complexity.

<!-- @approach -->
### Dropping Constants and Lower-Order Terms

<!-- @idea -->
Reduce an operation count to its dominant shape, since that is what survives as n grows.

<!-- @steps -->
1. Write the exact operation count as an expression in n.
2. Remove any multiplicative constants, since they do not affect how the cost responds to a change in n.
3. Remove any terms that grow more slowly than the largest one.
4. The remaining term is the complexity.
5. Remember separately that the discarded constant is still real work, even though Big O ignores it.

<!-- @code cpp -->
```cpp
// Exact count: 3n operations.  Complexity: O(n)
for (int i = 0; i < n; i++) {
    a[i] = a[i] + 1;    // three operations per iteration,
    b[i] = b[i] * 2;    // but still one pass over n elements
    c[i] = a[i] + b[i];
}

// Exact count: n + n = 2n.  Complexity: O(n)
for (int i = 0; i < n; i++) sum += a[i];    // SEQUENTIAL blocks ADD
for (int i = 0; i < n; i++) sum += b[i];    // they do not multiply

// Exact count: n^2 + n.  Complexity: O(n^2)
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++) count++;    // n^2 dominates
for (int i = 0; i < n; i++) sum += a[i];    // the n vanishes beside it

// At n = 1000: the n^2 term is 1,000,000 and the n term is 1,000.
// The smaller term is 0.1% of the total and shrinks as n grows.

// BUT constant factors are real work. Measured in the Prime Check subtopic:
//   plain square-root loop on 1000000007:  31,621 operations
//   6k +/- 1 refinement on the same input: 10,540 operations
// Both are O(sqrt n). Big O calls them equal; the clock does not.
```

<!-- @annotations -->
- 10: The most common misreading. Two loops in sequence are O(n), and only nesting produces O(n^2).
- 22: Worth holding both ideas at once: the classes are equal and one is three times faster.

<!-- @code java -->
```java
// 3n operations -> O(n)
for (int i = 0; i < n; i++) {
    a[i] = a[i] + 1;
    b[i] = b[i] * 2;
    c[i] = a[i] + b[i];
}

// n + n -> O(n).  Sequential blocks add.
for (int i = 0; i < n; i++) sum += a[i];
for (int i = 0; i < n; i++) sum += b[i];

// n^2 + n -> O(n^2).  The lower-order term is dropped.
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++) count++;
for (int i = 0; i < n; i++) sum += a[i];

// A triangular loop: n(n-1)/2 iterations -> still O(n^2).
// Roughly half the work, and the same complexity class —
// exactly the point made in the Nested Loops subtopic.
for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++) count++;
```

<!-- @annotations -->
- 21: Halving the constant is genuinely useful and does not move you to a better class.

<!-- @code python -->
```python
# 3n operations -> O(n)
for i in range(n):
    a[i] += 1
    b[i] *= 2
    c[i] = a[i] + b[i]

# n + n -> O(n). Sequential blocks ADD.
total = sum(a) + sum(b)

# n^2 + n -> O(n^2). The linear term vanishes.
count = 0
for i in range(n):
    for j in range(n):
        count += 1
total = sum(a)

# Why dropping constants is the RIGHT choice:
#   3n vs n     -> both double when n doubles
#   n^2 vs n    -> one quadruples, the other doubles
# The constant does not change how the cost RESPONDS to size,
# and that response is the entire question Big O is asking.

# Why it is still an approximation:
#   at n = 1000, n^2 is 1,000,000 and n is 1,000 — 0.1% of the total
#   at n = 10,  n^2 is 100       and n is 10    — 9% of the total
# The approximation gets better as n grows, which is the regime it is for.
```

<!-- @annotations -->
- 20: The reason the rule is principled rather than lazy.
- 26: Honest about where it breaks down: Big O is a statement about large n.

<!-- @approach -->
### Reading Complexity from Code

<!-- @idea -->
Apply four structural rules to derive the complexity without counting individual operations.

<!-- @steps -->
1. Identify each loop and how many times it runs relative to n.
2. Multiply the counts of nested loops, since the inner one restarts for every outer iteration.
3. Add the counts of sequential blocks, then keep only the largest.
4. Recognise a logarithm wherever a value is divided or multiplied by a constant each iteration.
5. Account for recursion by multiplying the number of calls by the work done in each.
6. Check whether the inner loop's bound depends on the outer counter, which changes the total.

<!-- @code cpp -->
```cpp
// RULE 1 — sequential blocks ADD, then take the maximum
void f1(int n) {
    for (int i = 0; i < n; i++) { }            // O(n)
    for (int i = 0; i < n * n; i++) { }        // O(n^2)
}   // total: O(n + n^2) = O(n^2)

// RULE 2 — nested loops MULTIPLY
void f2(int n) {
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++) { }
}   // O(n^2)

// RULE 3 — halving or doubling is LOGARITHMIC
void f3(int n) {
    for (int i = 1; i <= n; i *= 2) { }        // O(log n)
}

// COMBINED — a logarithmic loop nested in a linear one
void f4(int n) {
    for (int i = 0; i < n; i++)
        for (int j = 1; j <= n; j *= 2) { }
}   // O(n log n) — the shape of efficient sorting

// WATCH THE BOUND — the inner loop depends on the outer counter
void f5(int n) {
    for (int i = 0; i < n; i++)
        for (int j = 0; j < i; j++) { }
}   // 0 + 1 + 2 + ... + (n-1) = n(n-1)/2 -> still O(n^2)

// From this module:
//   Count Digits divides by 10 each step   -> O(log10 n), at most 19 iterations
//   GCD reduces the pair each step         -> O(log min(a,b)), 44 steps measured
//   Prime Check tests up to sqrt(n)        -> O(sqrt n), 315 ops vs 100,001
```

<!-- @annotations -->
- 15: The counter multiplies rather than increments, so it reaches n in log2(n) steps.
- 27: A triangular loop looks cheaper and is — by a factor of two, which Big O discards.

<!-- @code java -->
```java
// Sequential — add, then take the maximum
static void f1(int n) {
    for (int i = 0; i < n; i++) { }
    for (int i = 0; i < n * n; i++) { }
}   // O(n^2)

// Nested — multiply
static void f2(int n) {
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++) { }
}   // O(n^2)

// Doubling counter — logarithmic
static void f3(int n) {
    for (int i = 1; i <= n; i *= 2) { }
}   // O(log n)

// Recursion — count the calls, multiply by the work each does
static int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}   // O(2^n) — each call spawns two more.
    // fib(40) makes over a billion calls. fib(50) is hopeless.
    // This is genuinely exponential, unlike any depth of nested loops.
```

<!-- @annotations -->
- 24: The clearest example of exponential growth in ordinary code, and the reason memoisation exists.

<!-- @code python -->
```python
# Sequential — add, take the maximum
def f1(n):
    for i in range(n): pass
    for i in range(n * n): pass
# O(n^2)

# Nested — multiply
def f2(n):
    for i in range(n):
        for j in range(n): pass
# O(n^2)

# Doubling — logarithmic
def f3(n):
    i = 1
    while i <= n:
        i *= 2
# O(log n)

# HIDDEN COSTS — the syntax does not show the complexity
def f4(arr, targets):
    return [t for t in targets if t in arr]        # 'in' on a LIST is O(n)
# O(len(targets) * len(arr)) — quadratic if both grow

def f5(arr, targets):
    lookup = set(arr)                               # O(n) to build
    return [t for t in targets if t in lookup]      # 'in' on a SET is O(1)
# O(len(arr) + len(targets)) — linear

# Identical-looking code, quadratic versus linear.
# This is the single most valuable complexity fact in Python.
```

<!-- @annotations -->
- 22: Membership testing on a list scans it. On a set it hashes. The keyword is the same.
- 30: Converting to a set first is the standard fix, and it turns a nested scan into two passes.

<!-- @approach -->
### Choosing an Algorithm from the Constraints

<!-- @idea -->
Read the input limits in the problem statement and rule out every complexity that cannot finish.

<!-- @steps -->
1. Find the maximum value of n stated in the constraints.
2. Assume roughly 100 million elementary operations per second.
3. Compute what your intended approach would cost at that maximum n.
4. Compare that against the budget, and reject the approach if it exceeds it.
5. Work backwards from the limit to the complexity class you need.
6. Only then start writing code.

<!-- @code cpp -->
```cpp
// Budget: about 10^8 operations per second.
// Computed — the largest n each class handles inside that budget:
//
//   O(n!)        n <= 11
//   O(2^n)       n <= 26
//   O(n^3)       n <= 464
//   O(n^2)       n <= 10,000
//   O(n log n)   n <= 4,523,071
//   O(n)         n <= 100,000,000

// WORKED DECISION: "Given an array of n <= 10^5 integers,
// does any pair sum to a target?"

// Nested loops: n^2 = 10^10 operations. 100 seconds. REJECTED
// before writing it, purely from the constraint.
bool hasPairSlow(vector<int>& arr, int target) {
    for (int i = 0; i < arr.size(); i++)
        for (int j = i + 1; j < arr.size(); j++)
            if (arr[i] + arr[j] == target) return true;
    return false;
}

// Hash set: one pass, n = 10^5 operations. Instant. ACCEPTED.
bool hasPairFast(vector<int>& arr, int target) {
    unordered_set<int> seen;
    for (int x : arr) {
        if (seen.count(target - x)) return true;
        seen.insert(x);
    }
    return false;
}
// O(n) time, O(n) space — trading memory for time, which is
// the most common trade in the whole subject.

// READING THE CONSTRAINT BACKWARDS:
//   n <= 10        -> permutations are fine
//   n <= 20        -> subsets are fine
//   n <= 500       -> cubic is fine
//   n <= 5,000     -> quadratic is fine
//   n <= 10^6      -> need O(n log n) or better
//   n <= 10^9      -> need O(log n) or O(sqrt n)
```

<!-- @annotations -->
- 15: The decision is made before any code exists, which is the entire practical value of complexity analysis.
- 32: Note the space went from O(1) to O(n). Faster is rarely free.

<!-- @code java -->
```java
// Same decision in Java.

// n <= 10^5, so n^2 = 10^10 operations. Rejected on sight.
static boolean hasPairSlow(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++)
        for (int j = i + 1; j < arr.length; j++)
            if (arr[i] + arr[j] == target) return true;
    return false;
}

// O(n) time, O(n) space.
static boolean hasPairFast(int[] arr, int target) {
    java.util.Set<Integer> seen = new java.util.HashSet<>();
    for (int x : arr) {
        if (seen.contains(target - x)) return true;
        seen.add(x);
    }
    return false;
}

// A third option when memory is tight: sort, then two pointers.
// O(n log n) time and O(1) extra space — slower than the hash set
// and cheaper in memory. Which is better depends on which limit
// the problem actually constrains.
```

<!-- @annotations -->
- 21: Worth internalising early: there is usually more than one acceptable answer, chosen by which resource is scarce.

<!-- @code python -->
```python
# n <= 10^5, so a nested scan is 10^10 operations — rejected.
def has_pair_slow(arr, target):
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] + arr[j] == target:
                return True
    return False

# O(n) time, O(n) space
def has_pair_fast(arr, target):
    seen = set()
    for x in arr:
        if target - x in seen:
            return True
        seen.add(x)
    return False

# Python is roughly 10 to 100 times slower per operation than C++,
# so the practical budget is closer to 10^6 to 10^7 operations
# per second rather than 10^8. The complexity class does not change —
# the constant factor does, and near a limit that matters.
#
# The usual response is to push work into built-ins and library
# functions, which run as compiled code rather than interpreted loops:
def total_slow(arr):
    s = 0
    for x in arr:      # interpreted loop
        s += x
    return s

def total_fast(arr):
    return sum(arr)    # same O(n), far smaller constant
```

<!-- @annotations -->
- 18: An honest adjustment. The class is what you reason about; the constant is what decides borderline cases.
- 29: Same complexity, and the built-in wins because its loop is not running in the interpreter.

<!-- @example -->

<!-- @input -->
Two loops over n, once nested and once in sequence

<!-- @output -->
Nested is O(n²). Sequential is O(n).

<!-- @why -->
The single most common misreading. The visual difference between the two is one level of indentation, and the cost difference is a factor of a million at realistic input sizes.

<!-- @walkthrough -->
1. In the nested version the inner loop restarts completely for every iteration of the outer one.
2. That gives n multiplied by n executions of the body, which is n squared.
3. In the sequential version each loop runs to completion before the next begins.
4. That gives n plus n executions, which is 2n.
5. Dropping the constant leaves O(n), so the two structures differ by an entire complexity class.
6. At n equal to one million that is a million operations against a trillion — instant against never.

<!-- @example -->

<!-- @input -->
Prime checking to n-1 versus stopping at √n, on n = 100003

<!-- @output -->
100,001 operations against 315 — the same answer

<!-- @why -->
Measured in the Prime Check subtopic rather than assumed here. It shows a complexity improvement translating into a concrete count on a real input.

<!-- @walkthrough -->
1. The linear scan tests every candidate divisor from 2 up to 100002.
2. Since the number is prime none divides evenly, so there is no early exit and all 100,001 tests run.
3. The square-root version stops once the candidate squared exceeds the number, which is at 316.
4. That is 315 operations, and it reaches an identical conclusion.
5. Everything beyond the square root could only find the larger partner of a pair already tested.
6. The measured reduction is 317-fold, and it came from changing one loop bound.

<!-- @example -->

<!-- @input -->
The 6k ± 1 refinement against the plain square-root loop, on n = 1000000007

<!-- @output -->
10,540 operations against 31,621 — both O(√n)

<!-- @why -->
The clearest demonstration of Big O's limitation. It is answering how cost grows, not how much cost there is, and both facts matter when a solution sits near a time limit.

<!-- @walkthrough -->
1. The plain loop tests every candidate up to the square root, roughly 31,623 of them.
2. The refined version eliminates all multiples of 2 and 3 first, which is two thirds of every integer.
3. It then steps by 6, testing two candidates per stop rather than six.
4. The measured counts are 31,621 against 10,540, a ratio of exactly 3.0.
5. Both are O of the square root of n, so Big O treats them as equivalent.
6. The three-fold saving is real work that the notation deliberately discards.

<!-- @example -->

<!-- @input -->
A problem stating n ≤ 10⁵, and an idea that requires nested loops

<!-- @output -->
10¹⁰ operations — about 100 seconds. Rejected before writing any code.

<!-- @why -->
The practical payoff of the entire subtopic — the algorithm is chosen from the constraints before a line is written, rather than discovered after a timeout.

<!-- @walkthrough -->
1. The constraint gives a maximum n of 100,000.
2. A nested loop over the same data performs n squared operations, which is 10 to the 10th.
3. At roughly 100 million operations per second that is about 100 seconds.
4. Typical time limits are 1 to 2 seconds, so the approach cannot pass regardless of how it is written.
5. Working backwards, a budget of 10 to the 8th at n equal to 10 to the 5th permits about 1,000 operations per element.
6. That points at O(n log n) or O(n), which is what a sort or a hash set provides.

<!-- @visualization custom -->

<!-- @description -->
A growth-curve plot is the spine. Draw operations against input size with a curve for each class — constant, logarithmic, square root, linear, linearithmic, quadratic and exponential — starting them all near the origin where they are visually indistinguishable, which is itself the point: at small n every algorithm looks fine. Then animate the horizontal axis extending, and let the curves separate one by one as each in turn shoots off the top of the frame, with a label naming the n at which it left. Overlay a horizontal budget line at 10^8 operations and mark where each curve crosses it, dropping a vertical line down to the axis to read off the largest workable n — producing the computed values 11, 26, 464, 10,000, 4.5 million and 100 million as points the viewer derives from the picture rather than reads from a table. Add a DOUBLING panel that makes the classes tactile: an input bar doubles in length, and beside each class a work bar responds — constant does not move, logarithmic grows by one fixed notch, linear doubles, quadratic quadruples, exponential squares and leaves the frame. Repeat the doubling three times so the divergence compounds visibly. Then a CODE SHAPE panel that maps structure to class directly: two loop blocks drawn side by side sum into a single linear bar, the same two blocks drawn nested multiply into a quadratic square, and a loop whose counter doubles is drawn as a bar shrinking by half each step until only a handful of steps remain — three pictures for the three rules. Finish with a MEASURED panel plotting the actual counts recorded earlier in this module as points on the curves: Count Digits at 19, GCD at 44, Prime Check at 315 against 100,001, and the 6k refinement at 10,540 against 31,621 — with the last pair sitting on the same curve at different heights, labelled to show a constant factor as a vertical offset rather than a change of shape.

<!-- @sampleInput -->
```json
{"classes":[{"name":"O(1)","maxN":"unbounded"},{"name":"O(log n)","maxN":"unbounded"},{"name":"O(sqrt n)","maxN":"1e16"},{"name":"O(n)","maxN":100000000},{"name":"O(n log n)","maxN":4523071},{"name":"O(n^2)","maxN":10000},{"name":"O(n^3)","maxN":464},{"name":"O(2^n)","maxN":26},{"name":"O(n!)","maxN":11}],"budget":100000000,"growthTable":[{"n":100,"log2":7,"sqrt":10,"n":100,"nlogn":664,"n2":10000},{"n":10000,"log2":13,"sqrt":100,"nlogn":132877,"n2":100000000},{"n":1000000,"log2":20,"sqrt":1000,"nlogn":19931569,"n2":1000000000000}],"polynomialVsExponential":[{"n":10,"n2":100,"twoN":1024},{"n":30,"n2":900,"twoN":1073741824},{"n":60,"n2":3600,"twoN":1152921504606846976}],"measuredFromThisModule":[{"subtopic":"count-digits","class":"O(log10 n)","measured":19,"note":"max iterations, 64-bit"},{"subtopic":"gcd","class":"O(log min(a,b))","measured":44,"note":"hardest pair under 2e9"},{"subtopic":"prime-check","class":"O(n) -> O(sqrt n)","measured":[100001,315],"note":"n=100003"},{"subtopic":"prime-check-6k","class":"O(sqrt n) both","measured":[31621,10540],"note":"constant factor 3.0"}]}
```

<!-- @highlights -->
- All the growth curves start near the origin, visually indistinguishable — at small n every algorithm looks fine.
- The axis extends and the curves separate, each shooting off the top of the frame in turn with the n that broke it labelled.
- A horizontal budget line at 100 million operations is drawn across the plot.
- Where each curve crosses it, a vertical line drops to the axis to read off the largest workable input.
- Those crossings give 11 for factorial, 26 for exponential, 464 for cubic, 10,000 for quadratic and 4.5 million for linearithmic.
- The doubling panel doubles an input bar and shows each class's work bar respond differently.
- Constant does not move, logarithmic gains one fixed notch, linear doubles, quadratic quadruples, exponential leaves the frame.
- Repeating the doubling three times compounds the divergence until only the slow-growing bars remain visible.
- The code-shape panel draws two loop blocks side by side summing into one linear bar.
- The same two blocks nested instead multiply into a quadratic square, one indentation level apart.
- A loop with a doubling counter is drawn as a bar halving each step until only a handful remain.
- The measured panel plots this module's own recorded counts as points on the curves.
- Prime Check appears twice, at 100,001 and at 315, on two different curves.
- The 6k refinement appears at 10,540 against 31,621 on the same curve at different heights — a constant factor as a vertical offset, not a change of shape.

<!-- @edgeCases -->
- Small inputs, where a worse complexity class can genuinely be faster because the constant factor dominates.
- An algorithm with a good complexity class and an enormous constant, which loses to a simpler one at every realistic size.
- Best-case input, such as finding the target on the first comparison, which says nothing about the guarantee.
- Amortised cost, such as appending to a dynamic array, where most operations are constant and occasional ones are linear.
- Complexity stated in terms of the wrong variable, such as using n for an array length when the cost depends on the values inside it.
- Recursion whose depth grows with input size, where the stack space matters as much as the running time.
- Hidden library costs, such as membership testing on a list being linear while the identical syntax on a set is constant.
- String concatenation inside a loop, which can be quadratic in languages where strings are immutable.
- An input size so small that any approach passes, which makes complexity analysis irrelevant to that particular problem.
- Interpreted languages, where the per-operation constant is large enough to change what passes a time limit without changing any complexity.

<!-- @pitfalls -->
- Reading two sequential loops as quadratic, when only nesting multiplies and sequence adds.
- Assuming a better complexity class is always the better solution, when a bounded loop may be both simpler and correct where the faster form is not.
- Calling any depth of nested loops exponential, when fixed nesting is polynomial and exponential means the exponent grows with n.
- Quoting the best case as though it were the guarantee, when the worst case is what a judge will test.
- Ignoring space complexity entirely, particularly the stack space consumed by recursion.
- Treating constant factors as irrelevant, when a three-fold difference decides borderline submissions.
- Failing to read the constraints before choosing an approach, then discovering the timeout after writing the whole solution.
- Using list membership testing in Python inside a loop, which turns a linear algorithm quadratic with no visible change to the code.
- Counting the input array as auxiliary space, when auxiliary space normally excludes the input you were given.
- Assuming the 10 to the 8th operations per second figure holds for interpreted languages, where the practical budget is one or two orders of magnitude lower.

<!-- @doubt -->
### Why not just measure how long the code takes?

<!-- @answer -->
Because a stopwatch measures your machine rather than your algorithm. The same code times differently on different hardware, different compilers, and even on consecutive runs of the same machine. Complexity describes how the cost responds when the input grows, which is a property of the algorithm alone. That is also the question that actually matters — you rarely need to know whether something takes 40 or 60 milliseconds, and you frequently need to know whether it will still finish when the input is a thousand times larger.

<!-- @doubt -->
### Why do we drop constants? Isn't 3n genuinely slower than n?

<!-- @answer -->
It is, and Big O is answering a different question. Both 3n and n double when n doubles, and that shared response is what the notation captures. Dropping the constant isolates the property that survives changing machines, which is exactly what makes complexities comparable without benchmarking. The honest caveat is that the discarded constant is still real work. The Prime Check subtopic measured 10,540 operations against 31,621 for two algorithms that are both O of the square root of n — a genuine three-fold difference that Big O calls equal.

<!-- @doubt -->
### What is the difference between polynomial and exponential?

<!-- @answer -->
In polynomial growth the exponent is fixed and the base grows — n squared, n cubed. In exponential growth the base is fixed and the exponent grows — 2 to the n. They diverge violently. At n equal to 30, n squared is 900 and 2 to the n is over a billion. At n equal to 60, n squared is 3,600 and 2 to the n exceeds 10 to the 18th. Any fixed depth of nested loops is polynomial no matter how many you stack; only something like generating every subset is exponential.

<!-- @doubt -->
### How do I know which complexity a problem needs?

<!-- @answer -->
From the constraints, using roughly 100 million operations per second as the budget. Computed against that budget: factorial handles n up to 11, exponential up to 26, cubic up to 464, quadratic up to 10,000, linearithmic up to about 4.5 million, and linear up to 100 million. So a problem stating n up to 10 to the 5th rules out nested loops immediately, since that would be 10 to the 10th operations, around 100 seconds. Read the constraints before writing code — the algorithm is chosen there, not discovered after a timeout.

<!-- @doubt -->
### Should I quote the best, average, or worst case?

<!-- @answer -->
The worst case, unless asked otherwise. It is the only one that is a guarantee, and on a judge the tests are chosen adversarially so the worst case is what you will meet. Linear search is O(1) in the best case and O(n) in the worst, and quoting O(1) would be technically true and practically misleading. Prime Check is a good illustration: its worst case is a prime, because a composite exits early — which is precisely why every measurement in that subtopic used primes.

<!-- @doubt -->
### Does recursion cost more than a loop?

<!-- @answer -->
In memory, usually yes. Every pending call holds a stack frame until it returns, so recursion depth becomes space. The recursive Count Digits is O(log n) space where the iterative version is O(1) — identical time, different memory. At nineteen frames that is irrelevant, and it stops being irrelevant when the depth grows with the input size rather than with its digit count. Deep recursion can exhaust the stack entirely, which is a crash rather than a slowdown.

<!-- @doubt -->
### Is a better complexity class always the better solution?

<!-- @answer -->
No, and this module has shown it twice. Count Digits had an O(1) logarithm formula that returns the wrong answer above 10 to the 15th, against an O(log n) loop bounded at nineteen iterations — the loop is both simpler and correct. Complexity tells you how cost grows. It does not tell you whether the answer is right, whether n is ever large enough for the growth to matter, or how large the constant factor is. Use it to rule out approaches that cannot possibly finish, which is what it is genuinely excellent at.

<!-- @doubt -->
### Does the 10 to the 8th operations rule hold for Python?

<!-- @answer -->
Not directly. Python is roughly 10 to 100 times slower per operation than C++, so a more realistic budget is 10 to the 6th or 10 to the 7th operations per second. The complexity class does not change — an O(n log n) algorithm is still O(n log n) — but the constant factor is large enough to decide borderline submissions. The standard response is to push work into built-ins and library functions, which run as compiled code rather than interpreted loops. Using sum on a list rather than accumulating in a Python loop is the same complexity with a far smaller constant.
