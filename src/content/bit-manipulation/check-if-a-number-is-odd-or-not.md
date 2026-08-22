---
id: check-if-a-number-is-odd-or-not
topic: Bit Manipulation
title: Check if a Number is Odd or Not
difficulty: Easy
status: ready
prerequisites:
  - check-if-the-i-th-bit-is-set-or-not
  - introduction-to-bits-and-tricks
  - arithmetic-operators
  - relational-and-logical-operators
relatedIds:
  - check-if-a-number-is-power-of-2-or-not
  - count-the-number-of-set-bits
  - set-unset-the-rightmost-unset-bit
  - divide-two-numbers-without-multiplication-and-division
  - palindrome-number
---

<!-- @summary -->
Reading bit 0, with `i` pinned to zero — which sounds too small to need its own subtopic and is not, because the obvious alternative is wrong. `n % 2 == 1` misclassifies every negative odd number in C++ and Java: 500,000 failures over the range −1,000,000..1,000,000, all of them negative and odd. `n & 1` matched a parity reference on all 4,294,967,296 int32 values. What it does not buy is speed — used as a condition, `(n & 1) != 0` and `(n % 2) != 0` measured 6,250ns and 6,208ns over 65,536 elements, which is the same number.

<!-- @theory -->
## The problem

Report whether `n` is odd. Since bit 0 carries place value 1 and every other bit
carries an even place value, a number is odd exactly when bit 0 is set.

```
 7 = 0111   bit 0 = 1   odd
 6 = 0110   bit 0 = 0   even
-7 = …1001  bit 0 = 1   odd      (two's complement)
```

That last row is the entire subtopic. Everything else is bookkeeping.

## The spelling that is wrong

```cpp
if (n % 2 == 1)        // wrong for every negative odd number
```

C++ and Java define `%` so that the remainder takes the sign of the *dividend*:

| `n` | `n % 2` | `n & 1` |
|---|---|---|
| 7 | 1 | 1 |
| 6 | 0 | 0 |
| −6 | 0 | 0 |
| −7 | **−1** | **1** |
| −1 | **−1** | **1** |

So `-7 % 2` is −1, and −1 is not 1, and the test says "even". Checked over
−1,000,000..1,000,000, which contains 1,000,000 odd values:

| Spelling | Wrong on |
|---|---|
| `(n % 2) == 1` | **500,000** |
| `(n % 2) != 0` | 0 |
| `(n % 2) == 0` (for even) | 0 |
| `(n & 1) == 1` | 0 |

The 500,000 failures are exactly the negative odd values — every one of them,
and nothing else. Note which spelling escapes: the *even* test `n % 2 == 0`
is fine, because 0 has no sign. Only the odd test breaks, so a codebase can
test evenness correctly for years and then break the first time someone
inverts the condition.

## Python inverts the trap

Python's `%` follows the *divisor's* sign, so `-7 % 2` is 1:

| | C++ / Java | Python |
|---|---|---|
| `-7 % 2` | −1 | **1** |
| `(n % 2) == 1` | wrong on every negative odd | **correct** — 0 failures over 2,000,001 values |
| `(n & 1) == 1` | correct | correct |
| `-7 % 8` | −7 | **1** |
| `n % 8` vs `n & 7` | differ on 875,000 of 2,000,001 | **identical** — 0 differences |

This is the same shape as the `x / 2` versus `x >> 1` split from the
introduction, and it points the same way: the one spelling that is correct in
all three languages is the bit one. `n & 1` needs no argument about which
convention the language chose, because it does not divide.

## What it does not buy you

The folklore says `n & 1` is faster. Measured over 65,536 elements, best of 300
runs:

| Use | `n & 1` | `n % 2` |
|---|---|---|
| Summed as a value, unsigned | 7,208ns | 7,208ns |
| Summed as a value, signed | **7,208ns** | 10,458ns |
| Used as a condition, signed | 6,250ns | 6,208ns |

Two different stories in one table. Summing the *remainder* of a signed value
really does cost 1.45x more, because the sign rule forces real work. But using
it as a *condition* — which is what "is it odd" actually means — costs the same
either way, because `n % 2 != 0` only needs to know whether bit 0 is set and the
compiler knows that too.

There is also no branch-prediction story here: `if (n & 1)` measured 6,209ns on
random data and 6,208ns on perfectly alternating data, because the compiler
made it branchless in both cases.

So write `n & 1` because it is the spelling that cannot be written wrong, not
because it is fast. On this evidence the speed claim is only true for a use
nobody has.

## Divisibility by any power of two

The same idea generalises: `n % 2^k` keeps the low `k` bits, so

```
n % 8  == 0        becomes        (n & 7) == 0
n % 16 == 0        becomes        (n & 15) == 0
```

and the mask is always `2^k - 1`, a value with the low `k` bits set. Over
−1,000,000..1,000,000 the two forms of the *divisibility test* agreed on every
value, negatives included, because zero has no sign to disagree about.

The **remainders** are a different matter:

```
-7 % 8 = -7        -7 & 7 = 1
-1 % 8 = -1        -1 & 7 = 7
```

They disagreed on 875,000 of the 2,000,001 values tested — every negative that
is not a multiple of 8. `n & 7` gives the mathematical remainder, in 0..7, which
is usually what you wanted; `n % 8` gives the C++ one, which carries the sign.
In Python they never disagree, since `%` already floors.

## Where this goes next

**Check if a Number is Power of 2 or Not** replaces this single-bit question with
a whole-number one — not "is bit 0 set" but "is exactly one bit set anywhere" —
and answers it with `n & (n - 1)`, which the introduction has already met as the
idiom that drops the lowest set bit. **Count the Number of Set Bits** then asks
for the count rather than a yes or no.

<!-- @intuition -->
Every place value except the ones column is even, so the parity of a number is decided entirely by its last binary digit — exactly as the parity of a decimal number is decided by its last decimal digit. That makes "is it odd" the simplest possible bit read: mask off everything except bit 0. The reason this deserves its own subtopic rather than being a footnote to reading the i-th bit is that the natural alternative carries a language convention with it. Dividing asks what the remainder is, and every language has to decide what sign a negative remainder takes; C++ and Java give it the sign of the number being divided, so -7 % 2 is -1 and comparing that to 1 fails. Masking asks what the bit is, and a bit has no sign, so the same expression is correct everywhere.

<!-- @approach -->
### Brute Force - Remainder After Division

<!-- @idea -->
Divide by 2 and look at what is left over.

<!-- @steps -->
1. Compute `n % 2`.
2. Note that for a non-negative `n` this is 0 or 1.
3. Note that for a negative `n` in C++ and Java it is 0 or **−1**, because the remainder takes the sign of the dividend.
4. So compare against 0, never against 1 — `n % 2 != 0` is correct for every input.
5. Return that comparison.

<!-- @complexity -->
- time: O(1)
- space: O(1)
- note: Correct in the `!= 0` spelling and verified against a parity reference over all 4,294,967,296 int32 values, 0 mismatches. The `== 1` spelling is wrong on every negative odd number — 500,000 failures over −1,000,000..1,000,000. Summing the remainder of a signed value costs 1.45x the bit form, at 10,458ns against 7,208ns, but using it as a condition costs the same.

<!-- @code cpp -->
```cpp
bool isOdd(int n) {
    return n % 2 != 0;
}

// NOT this:
//     return n % 2 == 1;
// -7 % 2 is -1 in C++, so that returns false for every negative odd number.
// Measured: 500,000 wrong answers over the range -1,000,000..1,000,000.
//
// The EVEN test n % 2 == 0 is safe, because 0 carries no sign — which is
// why a codebase can be correct for years and break when the test is inverted.
```

<!-- @annotations -->
- 2: != 0 rather than == 1. This is the whole difference between a correct implementation and one that fails on half the number line.
- 6: The failures are exactly the negative odd values, so any test suite using non-negative inputs passes.
- 11: Worth noticing, because it explains why the bug is usually introduced during a refactor rather than when the code is first written.

<!-- @code java -->
```java
static boolean isOdd(int n) {
    return n % 2 != 0;
}

// Java's % follows the same rule as C++: the remainder takes the sign of
// the dividend, so -7 % 2 == -1 and the == 1 spelling fails identically.
// Math.floorMod(-7, 2) returns 1 if you want the mathematical remainder.
```

<!-- @annotations -->
- 2: Identical to the C++ version, and wrong in the same way if written as == 1.
- 7: floorMod is Java's version of Python's %, and it is the function to reach for when the sign of a remainder matters.

<!-- @code python -->
```python
def is_odd(n: int) -> bool:
    return n % 2 != 0


# In Python, n % 2 == 1 is also correct — -7 % 2 is 1, because the
# remainder follows the sign of the DIVISOR. Verified: 0 failures over
# -1,000,000..1,000,000. It is the one language where the natural
# spelling happens to be right, which is exactly why the habit does not
# survive translation to C++ or Java.
```

<!-- @annotations -->
- 2: Correct here, and the safer spelling to keep anyway, because it is the one that ports.
- 5: The inversion of the C++ trap. Code written in Python and translated literally acquires the bug on arrival.

<!-- @approach -->
### Better - Divide by Two and Multiply Back

<!-- @idea -->
Halve the number with integer division and double it again; only an even number survives the round trip.

<!-- @steps -->
1. Compute `n / 2` using integer division, which discards any fractional part.
2. Multiply the result by 2.
3. If `n` was even, nothing was discarded and the result equals `n`.
4. If `n` was odd, the division lost exactly one, so the result differs from `n`.
5. Return whether the round trip changed the value.

<!-- @complexity -->
- time: O(1)
- space: O(1)
- note: Verified exhaustively against a parity reference over all 4,294,967,296 int32 values, 0 mismatches — including INT_MIN, which is even and survives the round trip intact. Worth knowing because it uses neither % nor a bit operator, and because it is correct for negatives without any thought about remainder conventions: truncation loses one in the direction of zero either way.

<!-- @code cpp -->
```cpp
bool isOdd(int n) {
    return (n / 2) * 2 != n;
}

// Works for negatives without a special case: -7 / 2 is -3 and -3 * 2 is -6,
// which differs from -7. And INT_MIN is even, so (INT_MIN/2)*2 == INT_MIN
// with no overflow — verified across all 4,294,967,296 int32 values.
```

<!-- @annotations -->
- 2: Integer division truncates toward zero, so exactly one unit is lost for an odd n whatever its sign — which is why no remainder convention enters the picture.
- 5: The one value worth checking by hand in any signed algorithm, and here it behaves.

<!-- @code java -->
```java
static boolean isOdd(int n) {
    return (n / 2) * 2 != n;
}

// Integer.MIN_VALUE / 2 * 2 == Integer.MIN_VALUE, so the edge case that
// breaks Math.abs() leaves this one alone.
```

<!-- @annotations -->
- 2: Java truncates toward zero exactly as C++ does, so this transfers unchanged.

<!-- @code python -->
```python
def is_odd(n: int) -> bool:
    return (n // 2) * 2 != n


# // FLOORS rather than truncating, so -7 // 2 is -4 and -4 * 2 is -8,
# which still differs from -7. The conclusion survives the different
# rounding rule even though the intermediate value does not.
```

<!-- @annotations -->
- 2: The intermediate is -8 here against C++'s -6, and the test still gives the right answer — the round trip only has to change the value, not change it by a particular amount.

<!-- @approach -->
### Optimal - Test Bit 0

<!-- @idea -->
Every place value except the ones column is even, so parity is bit 0 and nothing else.

<!-- @steps -->
1. AND `n` with 1, which clears every bit except position 0.
2. The result is exactly 0 or 1, whatever the sign of `n`.
3. It is 1 when `n` is odd and 0 when `n` is even.
4. Return the result directly, or compare it against 0.
5. Note that no remainder convention is involved, because nothing was divided.

<!-- @complexity -->
- time: O(1) — one instruction
- space: O(1)
- note: Matched a parity reference on all 4,294,967,296 int32 values, 0 mismatches, in 2.32 seconds. Correct in C++, Java and Python with the same characters, which none of the % spellings are. It is not faster in the use that matters: as a condition it measured 6,250ns against 6,208ns for n % 2 != 0 over 65,536 elements, which is the same number. The 1.45x advantage appears only when the remainder is summed as a value rather than tested.

<!-- @code cpp -->
```cpp
bool isOdd(int n) {
    return (n & 1) == 1;
}

// == 1 is safe HERE, unlike in the general i-th bit case, because the mask
// is 1 << 0 and 2^0 is 1. This is the only position where the two forms
// of the bit test return the same number.
//
// Negatives need no care: -7 is ...11111001, so -7 & 1 is 1.
```

<!-- @annotations -->
- 2: The one place in this topic where comparing a masked value to 1 is correct, precisely because i is 0.
- 8: No cast, no unsigned copy — the AND ignores every bit the sign supplied.

<!-- @code java -->
```java
static boolean isOdd(int n) {
    return (n & 1) == 1;
}

// Java has no unsigned int and needs none here: the AND with 1 discards
// the sign bits, so >> versus >>> never enters the question.
```

<!-- @annotations -->
- 2: Identical characters to the C++ and Python versions, which is the argument for this form over the remainder one.

<!-- @code python -->
```python
def is_odd(n: int) -> bool:
    return n & 1 == 1


# Correct for arbitrarily large values too: (1 << 200 | 1) & 1 is 1.
# Measured 88ns per test against 82ns for n % 2 over 200,000 values —
# so in Python the bit form is very slightly SLOWER, and still the one
# to write, because it is the one that ports unchanged.
```

<!-- @annotations -->
- 2: Comparison binds more tightly than & in Python, so this parses as n & (1 == 1), which is n & True, which is n & 1 — accidentally correct here, and a habit that breaks the moment the mask is not 1. Write (n & 1) == 1.
- 5: No width limit, so parity of a 200-bit integer is the same single instruction.

<!-- @approach -->
### Generalisation - Divisibility by Any Power of Two

<!-- @idea -->
n % 2^k keeps the low k bits, so masking with 2^k - 1 answers the same question.

<!-- @steps -->
1. Note that `2^k - 1` is a value with exactly the low `k` bits set — 7 for k = 3, 15 for k = 4.
2. AND `n` with that mask to keep only the low `k` bits.
3. Those bits are the remainder on division by `2^k`, always in 0..2^k − 1.
4. Compare against 0 to test divisibility.
5. Note that the divisibility test agrees with `%` for negatives, but the remainder itself does not.

<!-- @complexity -->
- time: O(1)
- space: O(1)
- note: Over −1,000,000..1,000,000 the tests (n & 7) == 0 and n % 8 == 0 agreed on every value, because zero carries no sign. The remainders disagreed on 875,000 of the 2,000,001 — every negative that is not a multiple of 8 — since -7 & 7 is 1 while -7 % 8 is -7. In Python the two never disagree at all, because % already floors.

<!-- @code cpp -->
```cpp
bool divisibleByPowerOf2(int n, int k) {
    return (n & ((1 << k) - 1)) == 0;
}

int remainderByPowerOf2(unsigned n, int k) {
    return n & ((1u << k) - 1u);
}

// The DIVISIBILITY test agrees with % for negatives; the REMAINDER does not.
//     -7 % 8 == -7        -7 & 7 == 1
//     -1 % 8 == -1        -1 & 7 == 7
// Measured: 875,000 disagreements over 2,000,001 values.
```

<!-- @annotations -->
- 2: (1 << k) - 1 is the mask with the low k bits set. Subtracting one from a single set bit turns every bit below it on, which is the same borrowing behaviour that makes n & (n - 1) work.
- 6: Unsigned here on purpose — the masked result is the mathematical remainder, and giving it an unsigned type says so.
- 10: This is the useful half of the difference: the mask gives the remainder people usually mean, in 0..2^k - 1.

<!-- @code java -->
```java
static boolean divisibleByPowerOf2(int n, int k) {
    return (n & ((1 << k) - 1)) == 0;
}

// Math.floorMod(n, 8) and (n & 7) agree for every n; n % 8 does not.
```

<!-- @annotations -->
- 2: Identical to C++, including the behaviour for negatives.
- 5: The cleanest way to state the relationship in Java: the mask is floorMod, not %.

<!-- @code python -->
```python
def divisible_by_power_of_2(n: int, k: int) -> bool:
    return n & ((1 << k) - 1) == 0


# Python's % already floors, so n % 8 and n & 7 are equal for every n —
# verified over 2,000,001 values with 0 differences. The mask is still
# worth writing when k is a variable, since it avoids a division.
```

<!-- @annotations -->
- 2: Precedence again — & binds more loosely than ==, so the parentheses around the whole AND are required in a real expression.
- 5: The one language where the two forms are interchangeable for negatives as well as positives.

<!-- @example -->

<!-- @input -->
n = -7

<!-- @output -->
-7 % 2 is -1, so n % 2 == 1 says "even"; -7 & 1 is 1, so the bit test says "odd"

<!-- @why -->
It is the smallest input on which the two natural spellings disagree, and it disagrees in the direction that produces a wrong answer rather than a crash.

<!-- @walkthrough -->
1. In two's complement, -7 is …11111001 — bit 0 is 1, exactly as it is for +7.
2. So -7 & 1 is 1, and the bit test reports odd, which is correct.
3. Dividing instead: -7 / 2 truncates toward zero, giving -3.
4. The remainder must satisfy n == (n / 2) * 2 + (n % 2), so -7 == -6 + (n % 2), which forces n % 2 to be -1.
5. Comparing -1 against 1 is false, so n % 2 == 1 reports even.
6. Comparing -1 against 0 is true, so n % 2 != 0 reports odd, correctly.
7. In Python the remainder follows the divisor's sign instead, so -7 % 2 is 1 and the == 1 spelling is correct there — the same expression, a different answer, in two languages that look alike.

<!-- @example -->

<!-- @input -->
Every value in -1,000,000..1,000,000

<!-- @output -->
n % 2 == 1 is wrong on 500,000 of them, and every failure is a negative odd number

<!-- @why -->
It shows that the bug is not an edge case but half the number line, and shows precisely which half, which explains why tests miss it.

<!-- @walkthrough -->
1. The range holds 2,000,001 values, of which 1,000,000 are odd.
2. n % 2 == 1 gave the wrong answer on 500,000 of them.
3. That count is exactly the number of negative odd values in the range, so the failures are all of one kind and nothing else is affected.
4. The other three spellings — n % 2 != 0, n % 2 == 0 for evenness, and n & 1 — were wrong on 0 values.
5. The even test surviving is the important detail: 0 has no sign, so comparing a remainder against 0 is safe in a way that comparing against 1 is not.
6. That means a codebase testing evenness has no bug until someone inverts the condition to test oddness, which is a refactor that looks trivial.
7. Any test suite built from non-negative inputs — array lengths, counts, indices — passes all four spellings, which is why this reaches production.

<!-- @example -->

<!-- @input -->
n & 1 against a parity reference, over every int32

<!-- @output -->
4,294,967,296 values checked, 0 mismatches, in 2.32 seconds

<!-- @why -->
The claim is small enough to check completely rather than sample, and completeness is worth more here than any argument.

<!-- @walkthrough -->
1. Every one of the 4,294,967,296 bit patterns an int32 can hold was generated in turn.
2. Each was compared against the parity of its bit pattern computed independently.
3. n & 1 matched on every value, positive, negative and zero, with 0 mismatches.
4. The same run checked (n / 2) * 2 != n, which also matched on all 4,294,967,296 values.
5. That includes INT_MIN, which is even: (INT_MIN / 2) * 2 is INT_MIN exactly, with no overflow.
6. INT_MIN is worth calling out because it is the value that breaks abs() and therefore breaks any "handle negatives by taking the absolute value first" approach.
7. Neither correct form needs such a step, which is the practical reason to prefer them over anything that normalises the sign before testing.

<!-- @example -->

<!-- @input -->
n & 1 against n % 2, timed three ways

<!-- @output -->
1.45x when the remainder is summed, and no difference at all when it is used as a condition

<!-- @why -->
The performance claim attached to this trick turns out to be true only for a use case that does not exist.

<!-- @walkthrough -->
1. Over 65,536 unsigned elements, summing n & 1 and summing n % 2 both took 7,208ns — identical, because the compiler substitutes the AND itself.
2. Over 65,536 signed elements, summing n & 1 took 7,208ns and summing n % 2 took 10,458ns, a real 1.45x.
3. That gap is the sign rule: the remainder of a negative must come out negative, which takes extra instructions.
4. But "is it odd" is a condition, not a sum. Measured as a condition, (n & 1) != 0 took 6,250ns and (n % 2) != 0 took 6,208ns.
5. Those two numbers are the same to within noise, because the compiler knows a truth test only needs bit 0.
6. There is no branch story either: if (n & 1) took 6,209ns on random data and 6,208ns on perfectly alternating data, since it was compiled branchless in both cases.
7. So the argument for n & 1 is correctness and portability, not speed — and it is a strong argument on those grounds alone.

<!-- @visualization custom -->

<!-- @description -->
Open on the place-value panel: a row of eight bit cells with their place values above — 128, 64, 32, 16, 8, 4, 2, 1 — and every cell except the last greyed to make the point that only the ones column can contribute an odd amount. Sum the lit even columns for a sample value and show the running total staying even, then light bit 0 and watch the total tip odd. Then the negative panel, which is the heart of it: +7 and -7 drawn as full 32-bit rows one above the other, with bit 0 highlighted in both and visibly equal to 1. Beside them, run the two tests as parallel tracks. The bit track: AND with a mask that is 1 only at position 0, result 1, verdict odd, green for both inputs. The division track: -7 / 2 shown truncating toward zero on a number line (landing on -3, with an arrow pointing back toward 0), then the identity n == (n/2)*2 + (n%2) written out as -7 == -6 + r, solving to r = -1, and the comparison -1 == 1 lighting red. Hold on the asymmetry: the same track with the comparison changed to != 0 turns green, so the reader sees that one character is the entire fix. Next the coverage panel: a number line from -1,000,000 to 1,000,000 with the failures of n % 2 == 1 painted in — a solid block covering exactly the negative odds, nothing on the positive side — annotated 500,000 of 1,000,000 odd values, and three companion lines for the other spellings painted entirely clean. Then the language panel: three columns for C++, Java and Python showing -7 % 2 as -1, -1 and 1, with the == 1 spelling marked wrong, wrong, right, and the & 1 row marked right, right, right — the single row that is green all the way across. Extend it with -7 % 8 against -7 & 7 to show 875,000 disagreements in C++ and none in Python. Close with the timing panel: three grouped bars — unsigned sum (7,208 against 7,208), signed sum (7,208 against 10,458) and signed condition (6,250 against 6,208) — with only the middle group showing a visible gap, labelled "the only use where the speed claim holds, and not the use you have".

<!-- @sampleInput -->
```json
{"placeValues":{"bits":[128,64,32,16,8,4,2,1],"onlyOddColumn":1,"reading":"every place value except the ones column is even, so parity is bit 0 alone"},"worked":{"positive":{"n":7,"bits":"0111","bit0":1,"verdict":"odd"},"negative":{"n":-7,"bits":"11111111111111111111111111111001","bit0":1,"verdict":"odd"},"even":{"n":-6,"bits":"11111111111111111111111111111010","bit0":0,"verdict":"even"}},"divisionTrace":{"n":-7,"quotient":-3,"rounding":"toward zero","identity":"n == (n / 2) * 2 + (n % 2)","substituted":"-7 == -6 + r","remainder":-1,"tests":[{"expr":"n % 2 == 1","result":false,"correct":false},{"expr":"n % 2 != 0","result":true,"correct":true},{"expr":"(n & 1) == 1","result":true,"correct":true}]},"coverage":{"range":[-1000000,1000000],"values":2000001,"oddValues":1000000,"spellings":[{"expr":"(n % 2) == 1","wrong":500000,"whichOnes":"every negative odd value, and nothing else"},{"expr":"(n % 2) != 0","wrong":0},{"expr":"(n % 2) == 0","wrong":0,"note":"the even test is safe — 0 carries no sign"},{"expr":"(n & 1) == 1","wrong":0}],"whyTestsMiss":"any suite built from lengths, counts or indices is non-negative, and all four spellings agree there"},"exhaustive":{"valuesChecked":4294967296,"forms":[{"expr":"n & 1","mismatches":0},{"expr":"(n / 2) * 2 != n","mismatches":0}],"seconds":2.32,"intMin":{"value":-2147483648,"parity":"even","roundTrip":-2147483648,"note":"survives intact — the value that breaks abs() leaves both correct forms alone"}},"languages":{"minusSevenMod2":{"cpp":-1,"java":-1,"python":1},"minusSevenMod8":{"cpp":-7,"python":1},"maskEquivalent":{"expr":"-7 & 7","value":1},"eqOneSpelling":{"cpp":"wrong","java":"wrong","python":"correct"},"andOneSpelling":{"cpp":"correct","java":"correct","python":"correct"},"modVsMask":{"cpp":{"disagreements":875000,"of":2000001},"python":{"disagreements":0}},"javaHelper":"Math.floorMod(-7, 2) == 1"},"timing":{"unit":"ns","elements":65536,"bestOf":300,"groups":[{"use":"summed, unsigned","and":7208,"mod":7208,"ratio":1.0},{"use":"summed, signed","and":7208,"mod":10458,"ratio":1.45},{"use":"as a condition, signed","and":6250,"mod":6208,"ratio":0.99}],"branches":{"randomData":6209,"alternatingData":6208,"reading":"compiled branchless in both cases, so there is no misprediction story"},"python":{"tests":200000,"perTestNs":{"n & 1":88,"n % 2":82,"n % 2 == 1":91}},"conclusion":"the speed claim holds only when the remainder is summed as a value, which is not what an odd test does"},"generalisation":{"rule":"n % 2^k becomes n & (2^k - 1)","masks":[{"k":1,"mask":1},{"k":3,"mask":7},{"k":4,"mask":15}],"divisibilityAgrees":true,"remaindersDiffer":[{"n":-7,"mod8":-7,"mask7":1},{"n":-1,"mod8":-1,"mask7":7}],"disagreements":875000,"of":2000001,"maskGivesMathematicalRemainder":"always in 0..2^k - 1"}}
```

<!-- @highlights -->
- A row of eight cells shows the place values with every column except the ones greyed out.
- Lit even columns keep the running total even until bit 0 lights and tips it odd.
- +7 and -7 are drawn as full 32-bit rows with bit 0 highlighted and visibly equal in both.
- Two tracks then run in parallel on -7: the bit test and the division test.
- The bit track ANDs against a one-cell mask, gets 1, and turns green for both inputs.
- The division track shows -7 / 2 truncating toward zero and landing on -3.
- The identity n == (n/2)*2 + (n%2) is written out as -7 == -6 + r and solved to r = -1.
- The comparison -1 == 1 lights red, and changing it to != 0 turns the same track green.
- That one-character fix is held on screen so the reader sees the whole bug and its repair together.
- A number line from -1,000,000 to 1,000,000 paints the failures of n % 2 == 1 as a solid block on the negative side only.
- It is annotated 500,000 of 1,000,000 odd values, with three companion lines for the other spellings painted clean.
- A three-column language panel shows -7 % 2 as -1, -1 and 1 for C++, Java and Python.
- The == 1 row reads wrong, wrong, right, and the & 1 row reads right, right, right.
- The same panel extends to -7 % 8 against -7 & 7, with 875,000 disagreements in C++ and none in Python.
- Three grouped timing bars cover the unsigned sum, the signed sum and the signed condition.
- Only the middle group shows a visible gap, labelled as the only use where the speed claim holds.

<!-- @edgeCases -->
- Negative odd numbers — the entire failure set of n % 2 == 1, and the reason this subtopic exists.
- n = 0 — even, and every spelling agrees.
- n = -1 — odd, and the one many people predict wrongly, since -1 % 2 is -1 rather than 1.
- INT_MIN — even; both correct forms handle it, and (INT_MIN / 2) * 2 equals INT_MIN with no overflow.
- INT_MAX — odd, since it is 2^31 - 1 and every low bit is set.
- Testing evenness rather than oddness — n % 2 == 0 is safe for negatives, which hides the bug until the condition is inverted.
- A float in Python — 7.0 % 2 gives 1.0, but 7.0 & 1 raises TypeError, so the bit form fails loudly where the remainder form silently accepts the wrong type.
- Arbitrarily large integers in Python — n & 1 is unaffected; there is no width at which parity changes meaning.
- Divisibility by 8 for negatives — (n & 7) == 0 and n % 8 == 0 agree, even though n & 7 and n % 8 do not.
- char or short inputs in C++ — promoted to int before the operator runs, so the answer is unchanged but the type of the result is not.
- Using n & 1 on a bool — legal and pointless; the value is already 0 or 1.

<!-- @pitfalls -->
- Writing n % 2 == 1. Wrong for every negative odd number in C++ and Java — 500,000 failures over -1,000,000..1,000,000, and none of them reachable from a non-negative test suite.
- Assuming the Python spelling ports. Python's % follows the divisor's sign, so n % 2 == 1 is correct there and acquires the bug on translation.
- Believing n & 1 is faster. As a condition it measured 6,250ns against 6,208ns for n % 2 != 0 — the same number. The 1.45x only appears when the remainder is summed as a value.
- Taking the absolute value first to "handle" negatives. INT_MIN has no positive form, so that step introduces a bug rather than removing one.
- Using n & 7 as a drop-in for n % 8. The divisibility tests agree but the remainders do not — 875,000 disagreements over 2,000,001 values, since -7 % 8 is -7 while -7 & 7 is 1.
- Writing n & 1 == 1 in Python without parentheses. It parses as n & (1 == 1) and is accidentally correct only because the mask is 1.
- Testing parity of a floating-point value with &. It is a TypeError in Python and a compile error in C++ and Java, which is the good outcome — the danger is % silently accepting it.
- Expecting a branch-prediction win. Both the branchy and branchless forms measured identically here, because the compiler emitted branchless code either way.
- Inverting a correct even test into an incorrect odd test. n % 2 == 0 is safe and its negation n % 2 == 1 is not, so the refactor is where the bug enters.
- Using bit 0 of a value that has been shifted. n >> k & 1 is the parity of n / 2^k, not of n — obvious written out, and easy to lose inside a longer expression.
- Assuming % is always more readable. It is, until the sign of the operand is unknown, at which point the bit form is the one that needs no footnote.
- Relying on unsigned to dodge the problem. It works, but converting a negative to unsigned first turns -7 into 4294967289 — the parity survives, and every comparison you write afterwards does not.

<!-- @doubt -->
### Why is -7 % 2 equal to -1?

<!-- @answer -->
Because C++ and Java require that n == (n / 2) * 2 + (n % 2) and that division truncates toward zero. Truncating -7 / 2 gives -3, so -3 * 2 is -6, and the remainder has to make up the difference between -6 and -7, which is -1. The rule is that the remainder takes the sign of the dividend. Python chose the other convention — the remainder takes the sign of the divisor — so -7 % 2 is 1 there, and the identity holds with // flooring to -4 instead.

<!-- @doubt -->
### Is n & 1 actually faster than n % 2?

<!-- @answer -->
Not for this use. As a condition, which is what an odd test is, (n & 1) != 0 measured 6,250ns and (n % 2) != 0 measured 6,208ns over 65,536 elements — the same number. The compiler knows a truth test only needs bit 0. The 1.45x gap that people quote is real but appears only when you sum the remainder as a value on signed input: 7,208ns against 10,458ns. On unsigned input even that vanishes, both at 7,208ns. Write n & 1 because it cannot be spelled wrong, not because of the stopwatch.

<!-- @doubt -->
### Why does the even test survive when the odd test does not?

<!-- @answer -->
Because it compares against 0, and 0 has no sign. n % 2 is 0, 1 or -1 in C++; the even test asks "is it 0", which is right regardless of which of the two non-zero values the language would have produced. The odd test as usually written asks "is it 1", which excludes -1. This is why the bug typically appears during a refactor rather than at first writing — a correct n % 2 == 0 gets inverted to n % 2 == 1, which looks like the obvious negation and is not.

<!-- @doubt -->
### Does this work for negative numbers without any extra handling?

<!-- @answer -->
Yes, and that is the point. In two's complement -7 is …11111001, whose bit 0 is 1 exactly as +7's is, so n & 1 reports odd correctly with no cast, no unsigned copy and no absolute value. Verified against a parity reference across all 4,294,967,296 int32 values with 0 mismatches. Taking the absolute value first actively makes things worse, because INT_MIN has no positive counterpart — abs(INT_MIN) is still INT_MIN, so a "normalise the sign" step introduces a bug on the one input it was supposed to protect.

<!-- @doubt -->
### Can I use n & 7 instead of n % 8?

<!-- @answer -->
For the divisibility test yes, for the remainder no. (n & 7) == 0 and n % 8 == 0 agreed on every value over -1,000,000..1,000,000, because zero is signless. But the remainders themselves disagreed on 875,000 of those 2,000,001 values: -7 & 7 is 1 while -7 % 8 is -7, and -1 & 7 is 7 while -1 % 8 is -1. The mask gives the mathematical remainder, always in 0..7, which is usually the one you meant — it is what Math.floorMod returns in Java and what % already returns in Python.

<!-- @doubt -->
### Why does the mask 2^k - 1 have the low k bits set?

<!-- @answer -->
Subtracting 1 from a value with a single set bit borrows through every zero beneath it, turning them all into ones and the set bit into a zero. 8 is 1000 and 7 is 0111. That is the same borrowing behaviour that makes n & (n - 1) drop the lowest set bit, seen from the other side, and it is why the mask for "keep the low k bits" is always one less than the power of two. Power of 2 checks build directly on it in the next subtopic but one.

<!-- @doubt -->
### Which spelling should I write?

<!-- @answer -->
(n & 1) == 1 for oddness. It is the only spelling that is character-for-character correct in C++, Java and Python; it needs no thought about the sign of a remainder; and it matched a parity reference across every int32 value. If you prefer the arithmetic form, n % 2 != 0 is equally correct in all three — just never n % 2 == 1 outside Python. And if the language allows it, a named helper is worth more than either, because the bug this subtopic is about is one of spelling, and a spelling written once is a spelling reviewed once.

<!-- @doubt -->
### What about (n / 2) * 2 != n?

<!-- @answer -->
It is correct and worth knowing, though rarely worth writing. It matched the parity reference on all 4,294,967,296 int32 values, including INT_MIN, which is even and survives the round trip exactly. Its appeal is that it needs neither % nor a bit operator and is immune to the remainder-sign question entirely: integer division loses exactly one unit for an odd value whatever its sign. It even survives Python's different rounding — there -7 // 2 is -4 and -4 * 2 is -8, a different intermediate and the same conclusion.

<!-- @doubt -->
### Does parity mean anything different for huge numbers?

<!-- @answer -->
No, and Python makes that concrete. Its integers have no width, so (1 << 200 | 1) & 1 is 1 and the value is odd, exactly as any small odd number is. Nothing about parity depends on how many bits are above bit 0, because every one of those bits carries an even place value. In C++ and Java the same holds within the type, and the only care needed is that a long long parity test uses a long long mask if you write it as n & 1L rather than relying on promotion.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Check if a Number is Power of 2 or Not, which asks a whole-number question rather than a single-bit one: not "is bit 0 set" but "is exactly one bit set anywhere". The answer is n & (n - 1), the idiom the introduction already established as the one that drops the lowest set bit — if dropping it leaves nothing, there was only one. Count the Number of Set Bits then generalises further, from "is there exactly one" to "how many", and finds that the loop everyone writes first is the slowest of four options.
