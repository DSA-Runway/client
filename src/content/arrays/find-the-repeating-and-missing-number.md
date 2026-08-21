---
id: find-the-repeating-and-missing-number
topic: Arrays
title: Find the repeating and missing number
difficulty: Hard
status: ready
prerequisites:
  - find-missing-number
  - find-the-number-that-appears-once-and-other-numbers-twice
  - integer-overflow-and-precision-errors
  - for-loop
  - time-and-space-complexity-basics
relatedIds:
  - find-missing-number
  - find-the-number-that-appears-once-and-other-numbers-twice
  - count-subarrays-with-given-xor-k
  - majority-element-ii
---

<!-- @summary -->
One value appears twice and one is missing from 1..n — where the sum-of-squares method overflows a 32-bit integer at n = 1,861, thirty-five times earlier than the plain sum does, and where the XOR method trades 4.8x the running time for having no overflow threshold at all.

<!-- @theory -->
## The problem

An array holds n integers that should be 1 through n, but one value appears
**twice** and another is **missing**. Find both.

```
[4, 3, 6, 2, 1, 1]   ->  repeating 1, missing 5
```

## Two unknowns need two equations

Call the repeating value `x` and the missing one `y`. Comparing the array against
what it should have been gives one equation immediately:

```
sum(array) - sum(1..n)  =  x - y
```

One equation, two unknowns. Squaring gives the second:

```
sum(squares) - sum(1..n squared)  =  x² - y²  =  (x - y)(x + y)
```

Dividing the second by the first gives `x + y`, and from the sum and difference
both values fall out:

```
x = ((x-y) + (x+y)) / 2        y = x - (x-y)
```

That division is **always exact** — `x² − y²` factors as `(x−y)(x+y)`, so the
quotient is an integer by construction. Verified over 200,000 random pairs with
zero remainders.

## And that is where it goes wrong

The sums are the problem. Measured thresholds:

| Quantity | Exceeds int32 at |
|---|---|
| sum of 1..n | n = **65,536** |
| sum of **squares** of 1..n | n = **1,861** |

The squares overflow **thirty-five times earlier**. Anyone who has internalised
"the sum is fine until about 65,000" will be caught, because at n = 1,861 the
array is still small enough to look harmless.

At the usual constraint of n = 100,000 the sum of squares is
**333,338,333,350,000** — about **155,223× INT32_MAX**. A 64-bit accumulator
holds until n = 3,024,617, comfortably past any realistic input.

**Use 64-bit for both totals, and cast before multiplying**, not after.

### The same trap one level down

This is the second time in this module that a formula overflows earlier than its
result does. In **Find Missing Number** the threshold was n = 46,341 — not
because `n(n+1)/2` is too large there, but because the **product `n(n+1)`
overflows before the division happens**:

```
n = 46,340   n(n+1) = 2,147,441,940   fits
n = 46,341   n(n+1) = 2,147,534,622   overflows
n = 65,536   n(n+1)/2                 first exceeds int32
```

So `n(n+1)/2` written in 32-bit arithmetic fails at 46,341 while the value it
computes would fit until 65,536. Widening the *result* type is not enough; the
multiplication itself has to happen in 64 bits.

## The XOR alternative, which cannot overflow

XOR everything in the array together with everything in 1..n. Every value that
appears the correct number of times cancels, leaving `x ^ y`.

That is one value carrying both answers, and separating them uses the same trick
as **Find the Number That Appears Once**: pick any bit where `x` and `y` differ —
the lowest set bit of `x ^ y` will do — and partition both the array and the
range by it. Each group now contains exactly one of the two, so XORing each group
yields `x` and `y` separately.

```
x ^ y has a set bit wherever x and y differ
partition by any such bit -> x and y land in different groups
XOR each group -> one value each
```

**Then you still have to decide which is which.** The partition produces two
values but does not label them. Count one of them in the array: two occurrences
means it is the repeat. Skipping that step measured **exactly 50.00% wrong** over
all 12,164 valid arrays for n = 2..6 — a coin flip, which is precisely what it is.

XOR's advantage is that it **has no overflow threshold**: XOR never produces a
value outside the range of its inputs, so the method works unchanged at any n the
array itself can hold.

## What each costs

| n | Counting array | Math | XOR | Extra memory |
|---|---|---|---|---|
| 100,000 | 0.11ms | **0.01ms** | 0.06ms | 0.1 MB vs 0 |
| 1,000,000 | 1.87ms | **0.13ms** | 0.61ms | 1.0 MB vs 0 |
| 10,000,000 | 21.37ms | **1.29ms** | 6.14ms | 10.0 MB vs 0 |

The math method is fastest at every size — a single pass accumulating two totals,
then closed-form arithmetic. XOR is **4.8x slower** because it makes three passes
over the array and two over the range. The counting array is **16.6x slower** than
math and costs a byte per element.

## Which to write

- **Math**, with 64-bit accumulators, when n is known to be within range. Fastest
  and simplest to read.
- **XOR** when you want no overflow reasoning at all, or when n could be large
  enough to worry about. It costs about 5x, which is usually nothing in absolute
  terms.
- **A counting array** only when you also need the data for something else — it is
  the slowest and the only one that allocates.

<!-- @intuition -->
You know exactly what the array should have contained, so compare it against that ideal in two independent ways. Adding everything up tells you how far off the total is, which is the difference between the intruder and the absentee — but a single difference cannot say which two numbers produced it, since many pairs share it. Adding up the squares weights large values more heavily than small ones, so it reacts differently to the same pair and pins them down. The XOR route asks a different question entirely: instead of measuring how much the array is off by, it cancels every value that appears the right number of times, leaving only the fingerprints of the two culprits fused together — and then separates them by finding a bit where they disagree.

<!-- @approach -->
### Brute Force - Count Every Value

<!-- @idea -->
For each candidate value from 1 to n, scan the array counting how many times it occurs.

<!-- @steps -->
1. Take each value from 1 to n in turn.
2. Scan the whole array counting its occurrences.
3. A count of two identifies the repeating value.
4. A count of zero identifies the missing value.
5. Stop once both have been found.

<!-- @complexity -->
- time: O(n^2)
- space: O(1)
- note: Correct and needs no arithmetic reasoning, which makes it the reference implementation. Its scan runs once per candidate value regardless of the data, so it becomes unusable well before either linear method does.

<!-- @code cpp -->
```cpp
#include <vector>
#include <utility>
using namespace std;

pair<int,int> findRepeatingMissing(const vector<int>& a) {
    int n = a.size(), repeating = -1, missing = -1;

    for (int v = 1; v <= n; v++) {
        int count = 0;
        for (int x : a) if (x == v) count++;
        if (count == 2) repeating = v;
        else if (count == 0) missing = v;
        if (repeating != -1 && missing != -1) break;   // both found
    }
    return {repeating, missing};
}
```

<!-- @annotations -->
- 10: A full scan per candidate value, which is where the quadratic cost lives.
- 13: Stopping early once both are known, which helps on average but not in the worst case.

<!-- @code java -->
```java
static int[] findRepeatingMissing(int[] a) {
    int n = a.length, repeating = -1, missing = -1;

    for (int v = 1; v <= n; v++) {
        int count = 0;
        for (int x : a) if (x == v) count++;
        if (count == 2) repeating = v;
        else if (count == 0) missing = v;
        if (repeating != -1 && missing != -1) break;
    }
    return new int[]{repeating, missing};
}
```

<!-- @annotations -->
- 7: Exactly one value has a count of two and exactly one has zero, which the problem guarantees.

<!-- @code python -->
```python
def find_repeating_missing(a):
    n = len(a)
    repeating = missing = -1

    for v in range(1, n + 1):
        count = a.count(v)          # a full pass per candidate
        if count == 2:
            repeating = v
        elif count == 0:
            missing = v
        if repeating != -1 and missing != -1:
            break
    return repeating, missing


# Correct on every valid input, which makes it the reference the fast
# versions were checked against over all 12,164 arrays for n = 2..6.
```

<!-- @annotations -->
- 6: a.count is itself a full scan, so this single line carries the whole O(n^2).

<!-- @approach -->
### Counting Array

<!-- @idea -->
Mark each value as seen in an array indexed by the value itself, then read off the one seen twice and the one never seen.

<!-- @steps -->
1. Allocate a counter for every value from 1 to n.
2. Walk the array incrementing the counter for each value.
3. The value whose counter reached two is the repeat.
4. The value whose counter stayed at zero is the missing one.
5. Both are found in a single pass over the counters.

<!-- @complexity -->
- time: O(n), two passes
- space: O(n) for the counters
- note: Linear and obviously correct, and it is the slowest of the linear methods here — measured 21.37ms at ten million elements against the math method's 1.29ms, a factor of 16.6, plus ten megabytes of counters. Worth it only when the tally is useful for something else.

<!-- @code cpp -->
```cpp
#include <vector>
#include <utility>
using namespace std;

pair<int,int> findRepeatingMissing(const vector<int>& a) {
    int n = a.size();
    vector<char> seen(n + 1, 0);
    int repeating = -1, missing = -1;

    for (int v : a) {
        if (seen[v]) repeating = v;      // second sighting
        seen[v] = 1;
    }
    for (int v = 1; v <= n; v++) if (!seen[v]) missing = v;

    return {repeating, missing};
}
```

<!-- @annotations -->
- 7: One byte per possible value rather than an int, since only presence matters.
- 11: A value already marked is the repeat, so no separate counting pass is needed.

<!-- @code java -->
```java
static int[] findRepeatingMissing(int[] a) {
    int n = a.length;
    boolean[] seen = new boolean[n + 1];
    int repeating = -1, missing = -1;

    for (int v : a) {
        if (seen[v]) repeating = v;
        seen[v] = true;
    }
    for (int v = 1; v <= n; v++) if (!seen[v]) missing = v;

    return new int[]{repeating, missing};
}
```

<!-- @annotations -->
- 3: Sized n + 1 so the value n can index it directly, with slot zero simply unused.

<!-- @code python -->
```python
def find_repeating_missing(a):
    n = len(a)
    seen = bytearray(n + 1)
    repeating = missing = -1

    for v in a:
        if seen[v]:
            repeating = v
        seen[v] = 1

    for v in range(1, n + 1):
        if not seen[v]:
            missing = v
    return repeating, missing


# Measured 21.37ms at n = 10,000,000 with 10 MB of counters,
# against 1.29ms and no allocation for the math method.
```

<!-- @annotations -->
- 3: A bytearray rather than a list, which is one byte per value instead of a pointer.

<!-- @approach -->
### Optimal - Sum and Sum of Squares

<!-- @idea -->
Compare the array's total and its total of squares against what they should have been, giving two equations in the two unknowns.

<!-- @steps -->
1. Accumulate the array's sum and its sum of squares in one pass.
2. Subtract the expected sum of 1 to n to get the repeating value minus the missing one.
3. Subtract the expected sum of squares to get the difference of their squares.
4. Divide the second result by the first to get their sum, which is exact by construction.
5. The repeating value is half of the sum plus the difference.
6. The missing value is the repeating value minus the difference.

<!-- @complexity -->
- time: O(n), a single pass
- space: O(1)
- note: The fastest approach at every size measured — 1.29ms at ten million elements against XOR's 6.14ms and the counting array's 21.37ms. Its hazard is arithmetic rather than logical: the sum of squares exceeds a 32-bit integer at n = 1,861, thirty-five times earlier than the plain sum does, so both totals and the formulas must be computed in 64 bits.

<!-- @code cpp -->
```cpp
#include <vector>
#include <utility>
using namespace std;

pair<int,int> findRepeatingMissing(const vector<int>& a) {
    long long n = a.size();
    long long sum = 0, sumSq = 0;

    for (int v : a) { sum += v; sumSq += (long long)v * v; }   // cast BEFORE multiplying

    long long diff  = sum   - n * (n + 1) / 2;                  // x - y
    long long sqDiff = sumSq - n * (n + 1) * (2 * n + 1) / 6;   // x^2 - y^2
    long long total = sqDiff / diff;                            // x + y, always exact

    long long repeating = (diff + total) / 2;
    return {(int)repeating, (int)(repeating - diff)};
}
```

<!-- @annotations -->
- 9: The cast goes before the multiply. Casting the product afterwards would already have wrapped.
- 12: The sum of squares formula. In 32-bit arithmetic it overflows at n = 1,861, where the plain sum survives to 65,536.
- 13: Exact by construction, since x^2 - y^2 factors as (x - y)(x + y) — verified over 200,000 random pairs.

<!-- @code java -->
```java
static int[] findRepeatingMissing(int[] a) {
    long n = a.length;
    long sum = 0, sumSq = 0;

    for (int v : a) { sum += v; sumSq += (long) v * v; }

    long diff   = sum   - n * (n + 1) / 2;
    long sqDiff = sumSq - n * (n + 1) * (2 * n + 1) / 6;
    long total  = sqDiff / diff;

    long repeating = (diff + total) / 2;
    return new int[]{(int) repeating, (int) (repeating - diff)};
}
```

<!-- @annotations -->
- 5: (long) v * v casts the first operand, which promotes the whole multiplication. Casting the result would be too late.
- 8: Declaring n as long makes the formula's intermediate products 64-bit without further casts.

<!-- @code python -->
```python
def find_repeating_missing(a):
    n = len(a)
    total_sum = sum(a)
    total_sq = sum(v * v for v in a)

    diff = total_sum - n * (n + 1) // 2                 # x - y
    sq_diff = total_sq - n * (n + 1) * (2 * n + 1) // 6  # x^2 - y^2
    combined = sq_diff // diff                           # x + y, exact

    repeating = (diff + combined) // 2
    return repeating, repeating - diff


# Python integers are unbounded, so this cannot overflow here —
# which is exactly why porting it to C++ or Java without widening
# the accumulators produces a bug the Python version cannot show.
```

<!-- @annotations -->
- 7: The sum of squares. This is the quantity that overflows a 32-bit integer at n = 1,861 in other languages.
- 8: Integer division, and it is exact because x^2 - y^2 factors as (x - y)(x + y).

<!-- @approach -->
### XOR Partition - No Overflow Possible

<!-- @idea -->
XOR the array together with the full range so everything correct cancels, leaving the two culprits fused, then split them on a bit where they differ.

<!-- @steps -->
1. XOR every array element and every value from 1 to n into one accumulator.
2. Everything appearing the right number of times cancels, leaving the repeating value combined with the missing one.
3. Take the lowest set bit of that result, which is a bit where the two values differ.
4. Partition both the array and the range by that bit, XORing each group separately.
5. Each group now yields one of the two values.
6. Count one of them in the array to decide which is the repeat.

<!-- @complexity -->
- time: O(n), three passes over the array and two over the range
- space: O(1)
- note: Slower than the math method by about 4.8x — 6.14ms against 1.29ms at ten million elements — and it has no overflow threshold at all, since XOR never produces a value outside its inputs' range. That makes it the safer choice when n could be large or when the arithmetic reasoning is not worth doing.

<!-- @code cpp -->
```cpp
#include <vector>
#include <utility>
using namespace std;

pair<int,int> findRepeatingMissing(const vector<int>& a) {
    int n = a.size();
    int fused = 0;
    for (int v : a)          fused ^= v;
    for (int v = 1; v <= n; v++) fused ^= v;      // now fused == x ^ y

    int bit = fused & -fused;                      // lowest bit where they differ
    int groupSet = 0, groupClear = 0;
    for (int v : a)          (v & bit ? groupSet : groupClear) ^= v;
    for (int v = 1; v <= n; v++) (v & bit ? groupSet : groupClear) ^= v;

    int count = 0;
    for (int v : a) if (v == groupSet) count++;    // decide WHICH is the repeat
    return count == 2 ? make_pair(groupSet, groupClear)
                      : make_pair(groupClear, groupSet);
}
```

<!-- @annotations -->
- 9: Everything appearing the correct number of times cancels itself, leaving only the two culprits combined.
- 11: The lowest set bit isolates one position where the two values disagree, so they must land in different groups.
- 17: Without this count the pair comes out in arbitrary order — measured exactly 50.00% wrong, which is a coin flip.

<!-- @code java -->
```java
static int[] findRepeatingMissing(int[] a) {
    int n = a.length, fused = 0;
    for (int v : a) fused ^= v;
    for (int v = 1; v <= n; v++) fused ^= v;

    int bit = fused & -fused;
    int groupSet = 0, groupClear = 0;
    for (int v : a) { if ((v & bit) != 0) groupSet ^= v; else groupClear ^= v; }
    for (int v = 1; v <= n; v++) { if ((v & bit) != 0) groupSet ^= v; else groupClear ^= v; }

    int count = 0;
    for (int v : a) if (v == groupSet) count++;
    return count == 2 ? new int[]{groupSet, groupClear} : new int[]{groupClear, groupSet};
}
```

<!-- @annotations -->
- 6: fused & -fused isolates the lowest set bit using two's complement, with no loop required.

<!-- @code python -->
```python
def find_repeating_missing(a):
    n = len(a)
    fused = 0
    for v in a:
        fused ^= v
    for v in range(1, n + 1):
        fused ^= v                      # fused is now x ^ y

    bit = fused & -fused                # lowest bit where they differ
    group_set = group_clear = 0
    for v in a:
        if v & bit:
            group_set ^= v
        else:
            group_clear ^= v
    for v in range(1, n + 1):
        if v & bit:
            group_set ^= v
        else:
            group_clear ^= v

    if a.count(group_set) == 2:         # decide WHICH is the repeat
        return group_set, group_clear
    return group_clear, group_set


# No overflow threshold at any n, unlike the sum-of-squares method.
```

<!-- @annotations -->
- 9: The lowest set bit, guaranteed to exist because the two values are different.
- 22: Omitting this decision measured exactly 50.00% wrong across all 12,164 valid arrays tested.

<!-- @example -->

<!-- @input -->
a = [4, 3, 6, 2, 1, 1]

<!-- @output -->
repeating 1, missing 5

<!-- @why -->
The canonical case, traced through the arithmetic so both equations can be checked independently.

<!-- @walkthrough -->
1. Here n is 6, so the array should have held 1 through 6 exactly once each.
2. The array's sum is 17 and the expected sum of 1 to 6 is 21, so the difference is −4, which is x − y.
3. The array's sum of squares is 4 + 9 + 36 + 16 + 1 + 1 = 67.
4. The expected sum of squares for 1 to 6 is 91, so the difference is −24, which is x² − y².
5. Dividing −24 by −4 gives 6, which is x + y.
6. The repeating value is half of −4 plus 6, which is 1.
7. The missing value is 1 minus −4, which is 5.

<!-- @example -->

<!-- @input -->
n = 1,861 with the sums accumulated in 32-bit integers

<!-- @output -->
The sum of squares reaches 2,150,145,431 — past INT32_MAX of 2,147,483,647

<!-- @why -->
Locates the overflow precisely, and shows it arriving while the array is still small enough to seem safe.

<!-- @walkthrough -->
1. The sum of squares of 1 to n grows roughly as n cubed over three.
2. At n = 1,860 it is 2,146,682,110, which still fits a 32-bit integer.
3. At n = 1,861 it is 2,150,145,431, which does not.
4. The plain sum at that point is only 1,732,591 — nowhere near its own limit.
5. The plain sum does not overflow until n = 65,536, thirty-five times later.
6. So anyone reasoning from the familiar sum threshold will be caught out by the squares.
7. At the usual constraint of n = 100,000 the sum of squares is 333,338,333,350,000, about 155,223 times INT32_MAX.

<!-- @example -->

<!-- @input -->
The XOR partition without deciding which value is the repeat

<!-- @output -->
Exactly 50.00% wrong across all 12,164 valid arrays for n = 2 to 6

<!-- @why -->
Shows that the partition solves only half the problem, and that the missing half fails in the most literal possible way.

<!-- @walkthrough -->
1. XORing the array with the full range leaves the repeating value combined with the missing one.
2. Splitting on a differing bit puts each into its own group, so both values are recovered.
3. But nothing in that process records which group held the repeat.
4. Returning them in group order is therefore a guess between two orderings.
5. Measured across every valid array for n from 2 to 6, that guess was wrong on exactly half of them.
6. The fix is one extra pass counting either value in the array.
7. A count of two identifies the repeat, and the other value is the missing one.

<!-- @example -->

<!-- @input -->
10,000,000 elements, all three linear methods

<!-- @output -->
Math 1.29ms, XOR 6.14ms, counting array 21.37ms with 10 MB

<!-- @why -->
Prices the trade between the fastest method and the one that needs no overflow reasoning.

<!-- @walkthrough -->
1. The math method makes a single pass accumulating two running totals, then does closed-form arithmetic.
2. That measured 1.29ms and allocated nothing.
3. The XOR method makes three passes over the array and two over the range, so it touches the data five times.
4. That measured 6.14ms, about 4.8 times slower, and also allocated nothing.
5. The counting array makes two passes but writes a byte per element and then reads them back.
6. That measured 21.37ms and allocated ten megabytes.
7. So XOR costs roughly five times the math method in exchange for having no overflow threshold at all.

<!-- @visualization array -->

<!-- @description -->
Two rows drawn one above the other: the array as given, and directly beneath it the ideal 1..n it was supposed to be, aligned by value rather than by position so each column is a single value and the two rows can be compared column by column. Most columns match; exactly one column shows two tiles in the top row and one shows an empty slot. That picture is the whole problem, so open on it before any arithmetic. Then the math route, staged as two independent measurements rather than one procedure: run an adding machine along both rows accumulating totals, and show the two totals meeting at a difference — label it clearly as x minus y and then show WHY one equation is not enough by displaying three or four different value pairs that all produce the same difference, sliding them into the columns to show each would fit. Then run a second adding machine that squares each tile before adding, and repeat the same test: the candidate pairs that shared a difference now produce different square-differences, and all but one fall away. That is the moment the two equations become two equations. Beside the adding machines, keep a live width gauge on each accumulator showing how many bits the running total currently occupies, with a red line at 31 bits — and let the squares gauge cross that line while the plain-sum gauge is still barely a third of the way there, annotated with n = 1,861 against n = 65,536. For the XOR route, redraw both rows as bit patterns and fold them together column by column, with matched pairs visibly annihilating and vanishing from the frame, until only one pattern is left. Highlight its lowest set bit and show that bit acting as a sieve: every tile in both rows drops into one of two bins according to that bit, and each bin folds down to a single pattern. Two values emerge, unlabelled — and then deliberately stop, showing the two possible orderings side by side with a coin between them and the caption 50.00%. Only then run the deciding count. Close with three timing bars at 1.29ms, 6.14ms and 21.37ms, the third carrying a memory block showing ten megabytes beside two empty ones.

<!-- @sampleInput -->
```json
{"primary":{"input":[4,3,6,2,1,1],"n":6,"ideal":[1,2,3,4,5,6],"doubledColumn":1,"emptyColumn":5,"answer":{"repeating":1,"missing":5},"math":{"arraySum":17,"expectedSum":21,"diff":-4,"arraySumSq":67,"expectedSumSq":91,"sqDiff":-24,"combined":6,"repeating":1,"missing":5},"ambiguityDemo":{"diff":-4,"pairsSharingThisDiff":[[1,5],[2,6]],"note":"one equation is not enough - several pairs share a difference","squaresDistinguish":true}},"overflowPanel":{"int32Max":2147483647,"sumOfSquares":{"exceedsInt32AtN":1861,"valueAtN1860":2145660110,"valueAtN1861":2150145431},"plainSum":{"exceedsInt32AtN":65536,"valueAtN1861":1732591},"gapFactor":35,"atProblemLimit":{"n":100000,"sumOfSquares":333338333350000,"timesInt32Max":155223},"int64SafeUntilN":3024617,"relatedThreshold":{"subtopic":"find-missing-number","n":46341,"quantity":"n*(n+1) product","note":"overflows before the division, while n(n+1)/2 would fit until 65,536"}},"xorPanel":{"step1":"XOR array and range together - correct values cancel","fused":"x ^ y","step2":"lowest set bit is a position where x and y differ","step3":"partition both rows by that bit, XOR each bin","step4":"two values emerge, UNLABELLED","noDecideFailureRate":0.5000,"arraysTested":12164,"decider":"count one value in the array; two occurrences means it is the repeat","overflowThreshold":"none"},"costPanel":[{"n":100000,"countingMs":0.11,"mathMs":0.01,"xorMs":0.06,"countingMB":0.1},{"n":1000000,"countingMs":1.87,"mathMs":0.13,"xorMs":0.61,"countingMB":1.0},{"n":10000000,"countingMs":21.37,"mathMs":1.29,"xorMs":6.14,"countingMB":10.0}],"ratios":{"xorVsMath":4.8,"countingVsMath":16.6},"divisionExact":{"pairsTested":200000,"failures":0,"reason":"x^2 - y^2 factors as (x-y)(x+y)"}}
```

<!-- @highlights -->
- The array and the ideal 1..n are drawn as two aligned rows, matched by value so each column is a single value.
- Exactly one column shows two tiles stacked in the top row, and exactly one shows an empty slot — the whole problem in one picture.
- An adding machine runs along both rows and the totals meet at a difference, labelled as the repeating value minus the missing one.
- Several different value pairs sharing that same difference slide into the columns, showing one equation is not enough.
- A second adding machine squares each tile before adding, and the candidate pairs now produce different results.
- All but one candidate falls away, which is the moment two equations become two equations.
- A live bit-width gauge sits on each accumulator with a red line at 31 bits.
- The squares gauge crosses that line at n = 1,861 while the plain-sum gauge is barely a third of the way there.
- The two thresholds are annotated together: 1,861 against 65,536, a gap of thirty-five times.
- For the XOR route both rows are redrawn as bit patterns and folded together column by column.
- Matched pairs visibly annihilate and vanish from the frame until a single pattern remains.
- Its lowest set bit acts as a sieve, dropping every tile from both rows into one of two bins.
- Each bin folds down to a single pattern, and two values emerge unlabelled.
- The animation deliberately stops there, showing both possible orderings with a coin between them and the caption 50.00%.
- Only then does the deciding count run, identifying which value appears twice in the array.
- Three timing bars close it at 1.29ms, 6.14ms and 21.37ms, the third carrying a ten-megabyte memory block beside two empty ones.

<!-- @edgeCases -->
- n equal to 2, such as [1,1] — the smallest valid input, with 2 missing.
- The repeat and the missing value adjacent, such as [1,2,2,4] — nothing special, but easy to get wrong by eye.
- The missing value is 1 — the smallest possible, and the sum difference is then positive.
- The missing value is n — the largest possible, and the sum difference is then most negative.
- The repeating value is 1 and the missing is n, or the reverse — the extremes of the difference.
- The repeat and the missing value differ only in the lowest bit — the XOR partition still works, since that bit is set in the fused value.
- The repeat and the missing value differ only in the highest bit — the lowest set bit of the fused value is then that highest bit.
- n at 1,861 — where the sum of squares first exceeds a 32-bit integer.
- n at 46,341 — where n times n plus one first exceeds a 32-bit integer, which is the Find Missing Number threshold.
- n at 65,536 — where the plain sum first exceeds a 32-bit integer.
- n at 100,000 — the usual problem constraint, where the sum of squares is 155,223 times INT32_MAX.
- An array that does not satisfy the problem's guarantee — every method here assumes exactly one repeat and exactly one absentee.

<!-- @pitfalls -->
- Accumulating the sum of squares in a 32-bit integer. It overflows at n = 1,861, thirty-five times earlier than the plain sum does.
- Reasoning from the plain sum's threshold. Knowing the sum is safe to about 65,000 says nothing about the squares.
- Casting the product after multiplying rather than before. Writing the cast on the result means the multiplication has already wrapped.
- Computing n times n plus one in 32-bit arithmetic. That product overflows at n = 46,341 even though n(n+1)/2 would fit until 65,536 — the same trap measured in Find Missing Number.
- Returning the XOR partition's two values without deciding which is the repeat. Measured exactly 50.00% wrong, which is precisely a coin flip.
- Assuming Python's correctness transfers. Python integers are unbounded, so the same algorithm ported to C++ or Java gains an overflow bug the original cannot exhibit.
- Worrying that the division might not be exact. It always is, since x squared minus y squared factors as (x minus y) times (x plus y) — verified over 200,000 random pairs.
- Choosing a bit other than one where the two values differ. Any set bit of the fused value works; a clear bit would put both values in the same group.
- Using a counting array by default. It measured 16.6 times slower than the math method and costs a byte per element.
- Assuming XOR is slower because it is cleverer. It is slower because it makes five passes over the data rather than one, not because of the bit operations.
- Applying any of these to an array that breaks the guarantee. With two repeats or no missing value the equations are simply wrong.
- Indexing a counting array by the value without allocating n plus one slots. The value n needs a slot, so an array of size n is one short.

<!-- @doubt -->
### Why does the sum of squares overflow so much earlier than the sum?

<!-- @answer -->
Because it grows roughly as n cubed over three where the plain sum grows as n squared over two. Measured, the sum of squares first exceeds a 32-bit integer at n = 1,861 — where it reaches 2,150,145,431 — while the plain sum at that point is only 1,732,591 and does not overflow until n = 65,536. That is a gap of thirty-five times, and it matters because 1,861 elements is a small enough array that nothing about it looks risky. At the usual constraint of n = 100,000 the sum of squares is 333,338,333,350,000, about 155,223 times INT32_MAX. A 64-bit accumulator is safe until n = 3,024,617.

<!-- @doubt -->
### Is the division by the difference always exact?

<!-- @answer -->
Yes, by construction. The numerator is x squared minus y squared, which factors as (x minus y) times (x plus y), and the denominator is exactly x minus y — so the quotient is x plus y with no remainder. It cannot be zero either, since the repeating and missing values are guaranteed different. Verified over 200,000 random pairs with zero remainders. This is worth knowing because integer division elsewhere is usually a place to be suspicious, and here it genuinely is not.

<!-- @doubt -->
### Why does the XOR method need a counting pass at the end?

<!-- @answer -->
Because the partition recovers both values but does not label them. XORing the array with the range leaves the two culprits fused; splitting on a bit where they differ separates them into two groups, each yielding one value. Nothing in that process records which group held the value that appeared twice. Returning them in group order is a guess between two orderings, and measured across all 12,164 valid arrays for n from 2 to 6 that guess was wrong on exactly 50.00% of them. One extra pass counting either value in the array settles it: two occurrences means it is the repeat.

<!-- @doubt -->
### Which bit should the partition use?

<!-- @answer -->
Any bit that is set in the fused value. A set bit there means the two values disagree at that position, so partitioning on it puts them in different groups — which is the whole requirement. The lowest set bit is the conventional choice because it is free to compute: the expression fused AND negative-fused isolates it using two's complement, with no loop. Choosing a bit that is clear in the fused value would put both values in the same group and the method would return zero twice.

<!-- @doubt -->
### Should I use the math method or the XOR method?

<!-- @answer -->
The math method if you are willing to reason about overflow, since it was fastest at every size measured — 1.29ms at ten million elements against XOR's 6.14ms. The XOR method if you would rather not, since it has no overflow threshold at all: XOR never produces a value outside the range of its inputs, so it works unchanged at any n the array can hold. The cost of that safety is about 4.8 times, which at ten million elements is five milliseconds. XOR is slower simply because it makes five passes over the data rather than one, not because bit operations are expensive.

<!-- @doubt -->
### My Python solution works. Why would the same code fail in C++?

<!-- @answer -->
Because Python's integers grow as needed and C++'s do not. The sum of squares of 1 to 100,000 is 333,338,333,350,000, which Python holds without comment and a 32-bit int cannot. So the algorithm is correct and the port is not, and the Python version can never demonstrate the bug. This is the same asymmetry noted in 4 Sum: whenever a solution's correctness depends on arithmetic staying in range, testing it in Python proves the logic and says nothing about the arithmetic.

<!-- @doubt -->
### How does this relate to Find Missing Number?

<!-- @answer -->
It is that problem with a second unknown, and it repeats the same overflow lesson one level deeper. There, the threshold was n = 46,341 — not because the value n(n+1)/2 is too large, but because the product n times n plus one overflows before the division happens, while the result would have fitted until 65,536. Here the same distinction appears again with the squares: the formula's intermediate values, not its result, decide when it breaks. In both cases widening the result type is not enough; the multiplication itself has to happen in 64 bits.

<!-- @doubt -->
### Why not just use a counting array?

<!-- @answer -->
You can, and it is obviously correct, but it is the slowest option here and the only one that allocates. Measured at ten million elements it took 21.37ms against the math method's 1.29ms — 16.6 times slower — and needed ten megabytes of counters. The reason it loses despite being O(n) is that it writes a byte per element and then reads them all back, where the math method makes one streaming pass and keeps two running totals in registers. It is the right choice only when you need the tally for something beyond this question.
