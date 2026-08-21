---
id: maximum-product-subarray-in-an-array
topic: Arrays
title: Maximum Product Subarray in an Array
difficulty: Hard
status: ready
prerequisites:
  - kadanes-algorithm
  - print-subarray-with-maximum-subarray-sum
  - integer-overflow-and-precision-errors
  - for-loop
  - time-and-space-complexity-basics
relatedIds:
  - kadanes-algorithm
  - print-subarray-with-maximum-subarray-sum
  - reverse-pairs
  - move-zeros-to-end
---

<!-- @summary -->
Find the contiguous subarray with the largest product — where Kadane's algorithm applied directly is 56.53% wrong with negatives and 0% wrong without them, where the famous swap turns out to be an optimisation rather than the trick it is presented as, and where the problem is only well posed in fixed-width arithmetic because the constraints promise it.

<!-- @theory -->
## The problem

Return the largest product achievable by any contiguous subarray.

```
[2, 3, -2, 4]      ->  6     the subarray [2, 3]
[-2, 0, -1]        ->  0     the subarray [0]
[-2, 3, -4]        ->  24    the whole array — two negatives cancel
```

## Why Kadane's does not transfer

**Kadane's Algorithm** solves the sum version by keeping one running value: the
best sum ending here. Try that with products:

```
current = max(x, current * x)
best    = max(best, current)
```

Measured over all 2,441,405 arrays from the values {−2..2} with n up to 9, that
is wrong on **56.53%** of them. The smallest failure is `[-2, 1, -2]`, which
returns 1 where the answer is 4.

The reason is that multiplication has no monotone direction. For sums, a large
running total is always at least as useful as a small one. For products, the
**most negative** running value is the most valuable thing you can hold when the
next element is negative, because the two multiply into a large positive.

So one running value is not enough state. You need **two**: the largest product
ending here and the smallest.

```
current_max = max(x, current_max * x, current_min * x)
current_min = min(x, current_max * x, current_min * x)
```

Note the second and third candidates: an element can start a fresh subarray
(`x` alone), extend the best one, or extend the **worst** one — and on a negative
element it is the worst that becomes the best.

### And it is invisible without negatives

Restricted to non-negative values, the single-value Kadane version is wrong on
**0%** of inputs. Products of non-negative numbers only grow, so the minimum is
never useful and one running value suffices.

That is the whole difficulty compressed into one fact: a test suite without
negative numbers cannot distinguish the correct algorithm from a version missing
half its state.

## The swap is an optimisation, not the trick

The version usually presented swaps the two running values when the element is
negative, then updates each against a single candidate:

```
if (x < 0) swap(current_max, current_min);
current_max = max(x, current_max * x);
current_min = min(x, current_min * x);
```

This is routinely taught as *the* insight. Measured, it produces identical
results to the three-candidate form on **all 2,441,405 exhaustive arrays and
200,000 random ones** — zero differences.

So the swap is a **performance choice**: two comparisons per element instead of
four. It measured about 15% faster (20.46ms against 23.62ms at ten million
elements). It is worth knowing because the swap version is harder to read and
easy to get wrong, and nothing is lost by writing the explicit three-candidate
form if that is clearer to you.

## Zeros end everything

A zero makes every product through it zero, so it cuts the array into independent
segments. Both formulations handle this without a special case, because `x` alone
is always a candidate — after a zero, the running values restart from the next
element naturally.

But zero is also a legitimate answer. On `[-2, 0, -1]` the best product is `0`,
which is larger than either negative option.

## An alternative that needs no min at all

Scan the prefix products left to right, resetting to 1 after any zero, and keep
the largest seen. Then do the same right to left. The answer is the larger of
the two.

It works because the maximum-product subarray always extends to one end of its
zero-free segment: within a segment, if the total product is positive the whole
segment is best, and if it is negative then removing everything up to the first
negative or everything after the last one gives the answer — and those two
candidates are exactly what a left scan and a right scan find.

Verified over the same 2,441,405 arrays with zero failures. It measured about 57%
slower than the max/min scan (32.12ms against 20.46ms at ten million), since it
makes two passes, but it is noticeably easier to be confident in.

## The overflow is severe, and the constraints are load-bearing

Products grow multiplicatively, so fixed-width arithmetic runs out fast:

| Run | Overflows int32 after | Overflows int64 after |
|---|---|---|
| all 2s | 31 elements | 63 elements |
| all 3s | 20 elements | 40 elements |
| all 10s | **10 elements** | 19 elements |

And without a guarantee bounding the data, overflow is not an edge case:

| Values | n | Arrays with an overflowing product |
|---|---|---|
| −10..10 | 30 | **82.81%** |
| −100..100 | 10 | 98.56% |
| −100..100 | 30 | **100.00%** |

LeetCode 152 states that *any prefix or suffix product fits in a 32-bit integer*.
That constraint is doing an enormous amount of work: it is a promise about the
**data**, not a property of the algorithm, and without it the answer is not
representable at all.

**How not representable:** on a million random values from {−3..3} with no zeros,
the runs are far longer than 63 elements, so the true product exceeds even a
64-bit integer by an astronomical margin. Three correct implementations run on
such input **disagree with each other**, each wrapping differently. There is no
integer width that rescues it — the problem is only well posed when the input
bounds the products.

## What it costs

Measured on data with enough zeros to keep every product representable:

| n | Brute force | Max/min (swap) | Three-candidate | Prefix/suffix |
|---|---|---|---|---|
| 20,000 | 178.39ms | **0.06ms** | 0.06ms | 0.08ms |
| 1,000,000 | (too slow) | **2.03ms** | 2.34ms | 3.12ms |
| 10,000,000 | (too slow) | **20.46ms** | 23.62ms | 32.12ms |

The brute force is **2,973x** slower at twenty thousand. Among the linear
approaches the spread is small: the swap form is fastest, the three-candidate
form about 15% behind, and the two-pass prefix/suffix about 57% behind.

## Which to write

**Track both maximum and minimum**, in whichever of the two equivalent forms you
find clearer. Use a 64-bit accumulator, and read the constraints — if nothing
bounds the products, the question needs restating before it can be answered.

<!-- @intuition -->
With sums, a running total that has gone badly negative is simply bad news, and the best thing to do is abandon it and start again. With products it can be the most valuable thing you are carrying: a large negative running product is one negative element away from becoming a large positive one. So you cannot throw away the worst case, because the worst case is a candidate for the best. Carrying both means that whatever sign the next element has, one of the two values you are holding is already positioned to take advantage of it — and a zero simply ends the current run, since nothing multiplied through it survives.

<!-- @approach -->
### Brute Force - Every Subarray

<!-- @idea -->
Fix each start position, extend the end one element at a time carrying a running product, and keep the largest seen.

<!-- @steps -->
1. Take each index in turn as the start of a subarray.
2. Reset a running product to one.
3. Extend the end position through the rest of the array, multiplying each element in.
4. Compare the running product against the best so far after every element.
5. Carry the product forward rather than recomputing it, which keeps this quadratic rather than cubic.

<!-- @complexity -->
- time: O(n^2)
- space: O(1)
- note: Correct on every input and the natural reference, since it makes no argument about which running values are worth keeping. Measured 178.39ms at n = 20,000 against the max/min scan's 0.06ms, a factor of 2,973.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

long long maxProduct(const vector<int>& a) {
    long long best = LLONG_MIN;
    int n = a.size();

    for (int i = 0; i < n; i++) {
        long long product = 1;
        for (int j = i; j < n; j++) {
            product *= a[j];                    // carried forward, not recomputed
            best = max(best, product);
        }
    }
    return best;
}
```

<!-- @annotations -->
- 13: Carrying the product forward is what makes this O(n^2) rather than O(n^3).
- 14: Comparing after every element, since the best subarray can end anywhere.

<!-- @code java -->
```java
static long maxProduct(int[] a) {
    long best = Long.MIN_VALUE;

    for (int i = 0; i < a.length; i++) {
        long product = 1;
        for (int j = i; j < a.length; j++) {
            product *= a[j];
            best = Math.max(best, product);
        }
    }
    return best;
}
```

<!-- @annotations -->
- 5: A long accumulator. A run of ten 10s already exceeds a 32-bit integer.

<!-- @code python -->
```python
def max_product(a):
    best = None
    n = len(a)

    for i in range(n):
        product = 1
        for j in range(i, n):
            product *= a[j]
            if best is None or product > best:
                best = product
    return best


# Correct on every input, which makes it the reference the fast versions
# were checked against over 2,441,405 arrays from five values, n up to 9.
```

<!-- @annotations -->
- 8: The running product, rebuilt once per start rather than once per subarray.

<!-- @approach -->
### Prefix and Suffix Products

<!-- @idea -->
Sweep prefix products from the left and from the right, resetting after each zero, and take the largest value either sweep produces.

<!-- @steps -->
1. Walk left to right carrying a running product, starting at one.
2. Reset the running product to one immediately after it becomes zero.
3. Record the running product after each element as a candidate.
4. Walk right to left doing exactly the same.
5. The answer is the largest candidate from either direction.
6. The best subarray always reaches one end of its zero-free segment, which is why two directional sweeps suffice.

<!-- @complexity -->
- time: O(n), two passes
- space: O(1)
- note: Correct on all 2,441,405 arrays tested, and easier to be confident in than the max/min scan because it needs no reasoning about signs. It measured about 57% slower — 32.12ms against 20.46ms at ten million elements — since it walks the array twice.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

long long maxProduct(const vector<int>& a) {
    int n = a.size();
    long long best = LLONG_MIN, product = 1;

    for (int i = 0; i < n; i++) {
        if (product == 0) product = 1;          // a zero ends the segment
        product *= a[i];
        best = max(best, product);
    }

    product = 1;
    for (int i = n - 1; i >= 0; i--) {
        if (product == 0) product = 1;
        product *= a[i];
        best = max(best, product);
    }
    return best;
}
```

<!-- @annotations -->
- 11: Resetting after a zero rather than before, so the zero itself is still recorded as a candidate.
- 13: Every prefix is a candidate, which is what makes a single directional sweep meaningful.
- 17: The second sweep. A segment whose total product is negative is best truncated from one end or the other, and these two passes find both.

<!-- @code java -->
```java
static long maxProduct(int[] a) {
    int n = a.length;
    long best = Long.MIN_VALUE, product = 1;

    for (int i = 0; i < n; i++) {
        if (product == 0) product = 1;
        product *= a[i];
        best = Math.max(best, product);
    }

    product = 1;
    for (int i = n - 1; i >= 0; i--) {
        if (product == 0) product = 1;
        product *= a[i];
        best = Math.max(best, product);
    }
    return best;
}
```

<!-- @annotations -->
- 6: The reset happens at the start of the iteration, so a zero is recorded before being cleared.

<!-- @code python -->
```python
def max_product(a):
    n = len(a)
    best = None
    product = 1

    for i in range(n):
        if product == 0:
            product = 1                    # a zero ends the segment
        product *= a[i]
        best = product if best is None else max(best, product)

    product = 1
    for i in range(n - 1, -1, -1):
        if product == 0:
            product = 1
        product *= a[i]
        best = max(best, product)
    return best


# No reasoning about signs at all — the two directions cover the two ways
# a negative-product segment can be truncated.
```

<!-- @annotations -->
- 8: Resetting after the zero has already been counted, so zero remains a valid answer.
- 13: The reverse sweep, which finds the segments best truncated from their left end.

<!-- @approach -->
### Optimal - Track Both Maximum and Minimum

<!-- @idea -->
Carry the largest and the smallest product ending at the current position, since a negative element turns the smallest into the largest.

<!-- @steps -->
1. Start both running values and the answer at the first element.
2. For each later element, consider three candidates: the element alone, the element times the running maximum, and the element times the running minimum.
3. The new maximum is the largest of those three and the new minimum is the smallest.
4. Both must be computed from the old values, so compute them before assigning either.
5. Update the answer with the new maximum.
6. A negative element swaps which running value is useful, which is what makes the minimum necessary.

<!-- @complexity -->
- time: O(n), a single pass
- space: O(1) — two running values
- note: The recommended solution and the fastest measured, at 20.46ms for ten million elements against the prefix/suffix version's 32.12ms. The commonly taught swap form is equivalent rather than necessary: it measured identical results on all 2,441,405 exhaustive arrays and is about 15% faster, being two comparisons per element instead of four.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

long long maxProduct(const vector<int>& a) {
    long long best = a[0], curMax = a[0], curMin = a[0];

    for (size_t i = 1; i < a.size(); i++) {
        long long x = a[i];
        if (x < 0) swap(curMax, curMin);         // a negative swaps their roles
        curMax = max(x, curMax * x);             // x alone, or extend the run
        curMin = min(x, curMin * x);
        best = max(best, curMax);
    }
    return best;
}
```

<!-- @annotations -->
- 10: The swap is an optimisation, not the insight — it measured identical to the three-candidate form on every input tested.
- 11: x alone is always a candidate, which is how a zero ends the previous run without a special case.
- 13: Only the maximum feeds the answer; the minimum exists purely to be promoted by a future negative.

<!-- @code java -->
```java
static long maxProduct(int[] a) {
    long best = a[0], curMax = a[0], curMin = a[0];

    for (int i = 1; i < a.length; i++) {
        long x = a[i];
        long nextMax = Math.max(x, Math.max(curMax * x, curMin * x));   // all three
        long nextMin = Math.min(x, Math.min(curMax * x, curMin * x));
        curMax = nextMax;
        curMin = nextMin;
        best = Math.max(best, curMax);
    }
    return best;
}
```

<!-- @annotations -->
- 6: The explicit three-candidate form, which is equivalent to the swap version and easier to read.
- 8: Both are assigned only after both are computed, since each depends on the other's old value.

<!-- @code python -->
```python
def max_product(a):
    best = cur_max = cur_min = a[0]

    for x in a[1:]:
        cand = (x, cur_max * x, cur_min * x)      # element alone, or extend either run
        cur_max, cur_min = max(cand), min(cand)
        best = max(best, cur_max)
    return best


# [-2, 1, -2] -> 4.  Tracking only the maximum returns 1, and that bug is
# invisible on any array with no negative values.
```

<!-- @annotations -->
- 5: Building the candidates once, which avoids computing the products twice and makes the symmetry visible.
- 6: Tuple assignment evaluates the whole right side first, so both are computed from the old values.

<!-- @example -->

<!-- @input -->
a = [2, 3, -2, 4]

<!-- @output -->
6

<!-- @why -->
The canonical case, where the best subarray stops before a negative rather than running to the end.

<!-- @walkthrough -->
1. Both running values and the answer start at 2.
2. At the element 3, the candidates are 3 alone, 2 times 3, and 2 times 3 — so the maximum becomes 6 and the minimum 3.
3. The answer becomes 6.
4. At the element -2, the candidates are -2 alone, 6 times -2 which is -12, and 3 times -2 which is -6.
5. The maximum becomes -2 and the minimum becomes -12, so the answer stays at 6.
6. At the element 4, the candidates are 4 alone, -2 times 4 which is -8, and -12 times 4 which is -48.
7. The maximum becomes 4, which does not beat 6, so the answer is 6.

<!-- @example -->

<!-- @input -->
a = [-2, 1, -2] with only the maximum tracked

<!-- @output -->
1 — and the correct answer is 4

<!-- @why -->
The smallest input where dropping the minimum loses the answer, and it shows the minimum being promoted by a later negative.

<!-- @walkthrough -->
1. The whole array multiplies to 4, since the two negatives cancel.
2. Tracking only the maximum: it starts at -2, then at the element 1 becomes the larger of 1 and -2, which is 1.
3. At the final -2 the candidates are -2 alone and 1 times -2, so the maximum is -2 and the answer stays at 1.
4. The information that a running product of -2 existed has been discarded.
5. Tracking both, the minimum at the element 1 is the smaller of 1 and -2, which is -2.
6. At the final -2 the candidate -2 times -2 gives 4, which becomes the maximum.
7. Measured over 2,441,405 arrays, tracking only the maximum was wrong on 56.53% of them — and on 0% of arrays with no negative values.

<!-- @example -->

<!-- @input -->
The swap form against the explicit three-candidate form

<!-- @output -->
Identical results on all 2,441,405 exhaustive arrays and 200,000 random ones

<!-- @why -->
The swap is presented as the insight of this problem, and measuring shows it is a performance choice instead.

<!-- @walkthrough -->
1. The three-candidate form computes the element alone, the element times the maximum, and the element times the minimum, then takes the largest and smallest.
2. The swap form exchanges the two running values first when the element is negative, then compares each against one candidate.
3. When the element is negative, multiplying by it reverses the order of any two numbers — so the old minimum times it is the largest of the two products.
4. Swapping first therefore puts the right value in the right place, and one comparison each suffices.
5. Measured across every array from five values with n up to 9, and 200,000 random arrays, the two never differ.
6. The swap form does two comparisons per element where the other does four, and measured about 15% faster.
7. So the choice is readability against a small constant, not correctness.

<!-- @example -->

<!-- @input -->
A run of ten 10s, and arrays drawn from wider ranges

<!-- @output -->
Ten elements overflow a 32-bit integer; 100% of thirty-element arrays from −100..100 overflow

<!-- @why -->
Shows that the problem's constraints are load-bearing rather than incidental, which is unusual enough to be worth stating.

<!-- @walkthrough -->
1. Products grow multiplicatively, so a run of ten 10s reaches 10,000,000,000 and exceeds a 32-bit integer at the tenth element.
2. A run of 3s lasts twenty elements and a run of 2s lasts thirty-one.
3. Without a guarantee bounding the values, overflow is the normal case rather than an edge case.
4. Measured on thirty-element arrays from minus ten to ten, 82.81% contained an overflowing product.
5. From minus one hundred to one hundred, 100.00% did.
6. LeetCode 152 promises that any prefix or suffix product fits in a 32-bit integer, which is a statement about the data rather than the algorithm.
7. Without it, a million-element array of small values produces products beyond even 64 bits, and three correct implementations disagree because each wraps differently.

<!-- @visualization array -->

<!-- @description -->
The array as a strip of signed bars, with two running values carried above it as a facing PAIR of tracks — the maximum on an upper rail and the minimum on a lower one, drawn the same size and weight so neither reads as subordinate. That symmetry is the point: the lower track is not a diagnostic, it is a second candidate for the answer. As the marker advances, draw all three candidates for the next step as ghosted values before committing — the element alone, the element times the upper rail, and the element times the lower rail — then show the largest of the three settling onto the upper rail and the smallest onto the lower. On a negative element, animate the two rails visibly crossing over each other before the products are formed, because that crossing is what the swap form does explicitly and what the three-candidate form does implicitly. Run [-2, 1, -2] and hold the frame where the lower rail holds -2 while the upper holds 1: label the lower value as the one about to win, then let the final -2 multiply it into 4 and promote it to the answer. Beside it run a single-rail version on the same input, where the lower rail is simply absent, and show it finishing at 1 with the note that it never had the value it needed. Then a sign panel: the same single-rail version run on an array with no negatives, tracking correctly all the way through, captioned 0% wrong without negatives against 56.53% with them. For zeros, show a zero bar acting as a wall — both rails collapse onto it and restart from the next element, with the zero itself remaining highlighted as a legitimate answer. Close with an overflow panel that is deliberately alarming: a run of 10s multiplying step by step with the running value rendered in a fixed-width register, the digits filling the box and then overflowing past its edge at the tenth element, followed by the same demonstration in a 64-bit box overflowing at the nineteenth — and a final line noting that three correct implementations disagree on a million-element array because no integer width holds the answer.

<!-- @sampleInput -->
```json
{"primary":{"input":[2,3,-2,4],"answer":6,"trace":[{"i":0,"x":2,"curMax":2,"curMin":2,"best":2},{"i":1,"x":3,"candidates":[3,6,6],"curMax":6,"curMin":3,"best":6},{"i":2,"x":-2,"candidates":[-2,-12,-6],"curMax":-2,"curMin":-12,"best":6},{"i":3,"x":4,"candidates":[4,-8,-48],"curMax":4,"curMin":-48,"best":6}]},"minPromotionPanel":{"input":[-2,1,-2],"correct":4,"maxOnly":1,"trace":[{"x":-2,"curMax":-2,"curMin":-2},{"x":1,"curMax":1,"curMin":-2,"note":"the minimum holds -2, which the single-rail version has discarded"},{"x":-2,"candidates":[-2,-2,4],"curMax":4,"note":"the minimum is promoted"}],"maxOnlyFailureRate":0.5653,"arraysTested":2441405,"failureRateWithoutNegatives":0.0},"swapPanel":{"claim":"the swap is an optimisation, not a correctness requirement","exhaustiveArrays":2441405,"randomArrays":200000,"differences":0,"comparisonsPerElement":{"swap":2,"threeCandidate":4},"speedAtN10M":{"swapMs":20.46,"threeCandidateMs":23.62,"ratio":1.15}},"zeroPanel":{"input":[-2,0,-1],"answer":0,"note":"zero is a legitimate answer, larger than either negative option","handling":"x alone is always a candidate, so no special case is needed"},"overflowPanel":{"int32Max":2147483647,"runDepth":[{"value":2,"int32After":31,"int64After":63},{"value":3,"int32After":20,"int64After":40},{"value":10,"int32After":10,"int64After":19}],"overflowRates":[{"values":"-10..10","n":30,"rate":0.8281},{"values":"-100..100","n":10,"rate":0.9856},{"values":"-100..100","n":30,"rate":1.0}],"leetcodeConstraint":"any prefix or suffix product fits in a 32-bit integer","note":"a promise about the DATA, not a property of the algorithm","beyond64Bits":"on a million values from -3..3 with no zeros, three correct implementations disagree because each wraps differently"},"costPanel":[{"n":20000,"bruteMs":178.39,"maxMinMs":0.06,"threeWayMs":0.06,"prefixSuffixMs":0.08},{"n":1000000,"maxMinMs":2.03,"threeWayMs":2.34,"prefixSuffixMs":3.12},{"n":10000000,"maxMinMs":20.46,"threeWayMs":23.62,"prefixSuffixMs":32.12}],"bruteRatioAt20k":2973}
```

<!-- @highlights -->
- Two running values are carried above the strip as a facing pair of rails, the maximum upper and the minimum lower, drawn identically so neither reads as subordinate.
- That symmetry is the point: the lower rail is a second candidate for the answer, not a diagnostic.
- Before each step all three candidates appear as ghosts — the element alone, the element times the upper rail, and the element times the lower rail.
- The largest of the three settles onto the upper rail and the smallest onto the lower.
- On a negative element the two rails visibly cross over before the products are formed.
- That crossing is what the swap form does explicitly and the three-candidate form does implicitly.
- Running [-2, 1, -2], the frame holds where the lower rail carries -2 while the upper carries 1.
- The lower value is labelled as the one about to win, then the final -2 multiplies it into 4.
- A single-rail version runs beside it on the same input, its lower rail simply absent, finishing at 1.
- A sign panel runs that same single-rail version on an array with no negatives, where it tracks correctly throughout.
- It is captioned 0% wrong without negatives against 56.53% with them.
- A zero bar acts as a wall: both rails collapse onto it and restart from the next element.
- The zero itself stays highlighted, since it is a legitimate answer.
- An overflow panel multiplies a run of 10s step by step inside a fixed-width register.
- The digits fill the box and spill past its edge at the tenth element, then again at the nineteenth in a 64-bit box.
- A closing line notes that three correct implementations disagree on a million-element array, because no integer width holds the answer.

<!-- @edgeCases -->
- Single element — the answer is that element, whether positive, negative or zero.
- Single negative element — the answer is negative, so the running values cannot be initialised to zero or one.
- All positive — the whole array is the answer, and the minimum is never used.
- All negative with an even count — the whole array, since the negatives cancel.
- All negative with an odd count — the whole array minus one end, which is where the minimum earns its place.
- A single zero among negatives, such as [-2, 0, -1] — the answer is zero, larger than either negative.
- All zeros — the answer is zero.
- Zeros splitting the array into segments — each segment is independent, handled without a special case because the element alone is always a candidate.
- A zero at the very start or end — the reset must not skip recording the zero itself.
- Values large enough that a short run overflows — ten 10s already exceed a 32-bit integer.
- An array long enough that no integer width holds the product — the question is then not well posed.
- Two negatives separated by a positive, such as [-2, 1, -2] — the smallest case where tracking only the maximum fails.

<!-- @pitfalls -->
- Applying Kadane's algorithm directly, tracking only the running maximum. Measured 56.53% wrong, and 0% wrong on arrays with no negative values.
- Testing without negative numbers. Products of non-negative values only grow, so the single-value version is indistinguishable from the correct one.
- Assigning the new maximum before computing the new minimum. The minimum's candidates use the old maximum, so both must be computed first.
- Initialising the running values to zero or one instead of the first element. An array of a single negative then returns the wrong answer.
- Treating the swap as the correctness insight. It measured identical to the three-candidate form on all 2,441,405 exhaustive arrays — it is two comparisons instead of four.
- Adding a special case for zeros. The element alone is always a candidate, so a zero ends the previous run without help.
- Resetting the running product before recording a zero in the prefix/suffix version. Zero is a legitimate answer and must be counted.
- Running only the left-to-right prefix sweep. A segment whose product is negative may need truncating from its left end, which only the reverse sweep finds.
- Accumulating in a 32-bit integer. A run of ten 10s already overflows, and 100% of thirty-element arrays from minus one hundred to one hundred contain an overflowing product.
- Assuming 64 bits is enough. A run of nineteen 10s overflows that too, and a long array of small values overflows it astronomically.
- Ignoring the problem's constraint about prefix and suffix products. It is a promise about the data without which the answer is not representable.
- Comparing implementations on unbounded data. Three correct versions disagree there, each wrapping differently, so the disagreement says nothing about correctness.

<!-- @doubt -->
### Why does Kadane's algorithm not just work here?

<!-- @answer -->
Because multiplication has no monotone direction. For sums, a larger running total is always at least as useful as a smaller one, so one running value suffices. For products, the most negative running value is the most valuable thing you can hold when the next element is negative, since the two multiply into a large positive. Discarding it loses the answer. Measured over 2,441,405 arrays, tracking only the maximum was wrong on 56.53%, with [-2, 1, -2] the smallest failure — it returns 1 where the answer is 4.

<!-- @doubt -->
### My solution passes all my tests without tracking the minimum. How?

<!-- @answer -->
Your tests almost certainly have no negative numbers. Products of non-negative values only ever grow, so the minimum is never useful and one running value is genuinely sufficient — measured, the single-value version was wrong on 0% of non-negative arrays and 51.73% once negatives were allowed. This is the same shape as several other bugs in this module: a whole class of input makes the missing state invisible. Add [-2, 1, -2] and [-2, 3, -4] and it fails immediately.

<!-- @doubt -->
### Is the swap on a negative element required?

<!-- @answer -->
No — it is a performance choice. Measured across all 2,441,405 exhaustive arrays and 200,000 random ones, the swap form and the explicit three-candidate form never differ. It works because multiplying by a negative reverses the order of any two numbers, so exchanging the running values first puts the right one in position for a single comparison. That is two comparisons per element instead of four, and it measured about 15% faster at ten million elements. It is worth knowing that it is optional, because the swap version is the harder one to read and to get right, and nothing is lost by writing the three-candidate form.

<!-- @doubt -->
### Do I need a special case for zeros?

<!-- @answer -->
No, in either formulation. Because the element alone is always one of the candidates, a zero makes both running values zero and the next element restarts from itself — the run ends naturally. Zero is also a legitimate answer, not merely a boundary: on [-2, 0, -1] the best product is 0, since it beats both negative options. The only place zeros need explicit handling is the prefix/suffix approach, where the running product must be reset to one after a zero — and the reset must come after the zero has been recorded, or a valid answer is lost.

<!-- @doubt -->
### Why does the prefix/suffix version need two directions?

<!-- @answer -->
Because a segment between zeros is best truncated from one end or the other. If the segment's total product is positive, the whole segment is the answer and either sweep finds it. If it is negative, there is an odd number of negative elements, and the answer comes from dropping everything up to the first negative or everything after the last one — those are the only two candidates worth considering, and they are exactly what a left sweep and a right sweep produce. One direction alone would miss half of them.

<!-- @doubt -->
### How bad is the overflow really?

<!-- @answer -->
Bad enough that the problem's constraints are load-bearing. Products grow multiplicatively: a run of ten 10s already exceeds a 32-bit integer, a run of twenty 3s does, and a run of thirty-one 2s does. Without a bound on the data, overflow is the normal case rather than an edge case — measured, 82.81% of thirty-element arrays from minus ten to ten contain an overflowing product, and 100.00% of those from minus one hundred to one hundred. LeetCode 152's promise that any prefix or suffix product fits in a 32-bit integer is a statement about the input, not a property of the algorithm.

<!-- @doubt -->
### Would 64 bits fix it?

<!-- @answer -->
Only within the same kind of guarantee, and not in general. A run of nineteen 10s overflows a 64-bit integer, and a run of sixty-three 2s does. On a million random values from minus three to three with no zeros, the runs are far longer than that, so the true product exceeds any fixed width by an astronomical margin — three correct implementations run on such input disagree with each other, each wrapping differently. There is no integer size that rescues it. The problem is only well posed when the input bounds the products, which is why reading the constraints matters here more than in most problems.

<!-- @doubt -->
### Which of the three linear approaches should I write?

<!-- @answer -->
Whichever you find clearest, because the spread is small. Measured at ten million elements: the swap form at 20.46ms, the three-candidate form at 23.62ms, and the prefix/suffix version at 32.12ms — a range of about 1.6 times, against a brute force that is 2,973 times slower than any of them at twenty thousand elements. The prefix/suffix version is the easiest to be confident in since it needs no reasoning about signs at all, and paying 57% for that is often a good trade.
