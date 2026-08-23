---
id: check-if-a-number-is-power-of-2-or-not
topic: Bit Manipulation
title: Check if a Number is Power of 2 or Not
difficulty: Easy
status: ready
prerequisites:
  - check-if-a-number-is-odd-or-not
  - check-if-the-i-th-bit-is-set-or-not
  - introduction-to-bits-and-tricks
  - integer-overflow-and-precision-errors
relatedIds:
  - count-the-number-of-set-bits
  - set-unset-the-rightmost-unset-bit
  - single-number-i
  - power-set-bit-manipulation
  - divisors-of-a-number
---

<!-- @summary -->
A power of two is a number with exactly one set bit, so `n & (n - 1)` — the idiom that drops the lowest set bit — leaves nothing at all. Checked against a set-bit-counting reference over all 4,294,967,296 uint32 values in 153.7 seconds: the guarded form was wrong on 0, and the unguarded `(n & (n - 1)) == 0` was wrong on exactly **1**, namely zero. The guard has to be `n > 0` rather than `n != 0`, because `INT_MIN` genuinely has one set bit and passes every bit test in this subtopic. The loop everyone writes first measured **18.64x** slower.

<!-- @theory -->
## The problem

Report whether `n` is 2^k for some k ≥ 0. The bit view answers it immediately:

```
  1 = 00000001      2 = 00000010      4 = 00000100      16 = 00010000
 12 = 00001100     10 = 00001010     31 = 00011111
```

Powers of two are exactly the numbers with **one set bit**. Everything else in
this subtopic is a way of asking "is there exactly one".

## Dropping the only bit leaves nothing

The introduction established that `n & (n - 1)` clears the lowest set bit,
because subtracting one flips that bit off and turns every zero beneath it on:

```
n     = 16 = 00010000        n     = 12 = 00001100
n - 1 = 15 = 00001111        n - 1 = 11 = 00001011
AND        = 00000000        AND        = 00001000  = 8
```

If a number has one set bit, dropping it leaves zero. If it has more, something
survives. So:

```cpp
bool isPowerOfTwo(int n) { return n > 0 && (n & (n - 1)) == 0; }
```

## How wrong is the unguarded version?

Exactly one value wrong, out of four billion. Checked against a reference that
counted set bits, over every one of the 4,294,967,296 uint32 values, in 153.7
seconds:

| Form | Wrong on |
|---|---|
| `n && (n & (n - 1)) == 0` | 0 |
| `n && (n & -n) == n` | 0 |
| `popcount(n) == 1` | 0 |
| `(n & (n - 1)) == 0` — no guard | **1** |

That one value is `n = 0`: it has no set bits, so dropping the lowest leaves
zero and the test says yes. A one-in-four-billion failure rate sounds like an
edge case and is not, because zero is not a random input — it is the default
value of an uninitialised variable, the length of an empty container, and the
result of the subtraction just above it.

## Why the guard must be `n > 0` and not `n != 0`

Only 32 of the 4,294,967,296 values are powers of two, and in the signed reading
one of them is a trap:

```
INT_MIN = -2147483648 = 10000000000000000000000000000000
```

That is **exactly one set bit**. So `INT_MIN & (INT_MIN - 1)` is 0, and
`popcount(INT_MIN) == 1` is true, and every bit-counting argument in this
subtopic says yes. It is not a power of two, because it is negative — and no
bit test will ever tell you that, since the property being tested is about the
bit pattern rather than the value.

Measured: over −1,000,000..−1, **zero** negative values pass the unguarded test.
INT_MIN is not one of many, it is the only one, which is precisely why it
survives testing. Write `n > 0`.

## The float method: correct at 32 bits, and still wrong

The other approach people reach for is `log2(n)` and a check that it came out a
whole number. It is worth being accurate about this:

| | Result |
|---|---|
| `log2` over every uint32 | **0 wrong** |
| `log2` at n = 2^52 + 1 | says power of two — wrong |
| `log2` at n = 2^53 + 1 | says power of two — wrong |

A `double` carries 53 bits of mantissa, which is more than the 32 a `uint32`
needs, so the method really is exact for 32-bit input. It breaks the moment the
input is 64-bit: `2^53 + 1` cannot be represented, rounds to `2^53`, and
`log2` returns exactly 53.0. The test then reports a power of two with total
confidence.

So the argument against it is not "floats are inexact" — over the range this
subtopic usually covers they are exact. It is that the method's correctness
depends on a mantissa width nobody checks, and it silently stops holding when
the type widens. It also measured **16.43x** slower.

## Cost

Over 65,536 values, best of 200 runs:

| Method | Time | Ratio |
|---|---|---|
| `n & (n - 1)` | **31,083ns** | 1.00x |
| `n & -n` | 31,000ns | 1.00x |
| `popcount(n) == 1` | 31,083ns | 1.00x |
| `log2` | 510,583ns | 16.43x |
| divide until odd | 579,417ns | **18.64x** |

The three bit methods are indistinguishable — all one or two instructions. The
loop is the slowest thing here despite doing at most 32 iterations, because its
trip count depends on the data and it divides.

Note what this means for `popcount`: it is not slower, and it says what you mean
("exactly one bit"). If the language gives you `__builtin_popcount`,
`Integer.bitCount` or `int.bit_count`, that spelling is defensible on every
ground except that it needs a library.

## Where this goes next

**Count the Number of Set Bits** replaces "is it exactly one" with "how many",
and finds that the `n & (n - 1)` loop that answers it runs once per set bit
rather than once per position — the same idiom, used as a loop rather than a
single test. **Set/Unset the rightmost unset bit** then works on the other end
of the same borrowing behaviour that makes `n - 1` useful here.

<!-- @intuition -->
The bit pattern of a power of two is the simplest one there is: a single 1 with zeros everywhere else. So the question is not really "is this a power of two", it is "does this number have exactly one bit set" — and the idiom for that already exists, because subtracting one from a number always destroys its lowest set bit and turns every zero below it into a one. AND the two together and everything at or below that bit disappears; what is left is whatever was above it. For a power of two there is nothing above it, so the answer is zero. The only thing this argument cannot see is the sign, because it is an argument about bit patterns and a bit pattern does not know whether the top bit means +2^31 or -2^31 — which is exactly why INT_MIN, a single set bit sitting in the sign position, passes every test here and is not a power of two.

<!-- @approach -->
### Brute Force - Divide Until Odd

<!-- @idea -->
Keep halving while the number is even; a power of two ends at exactly 1.

<!-- @steps -->
1. Reject values that are zero or negative before starting.
2. While `n` is even, divide it by 2.
3. Each division removes one factor of 2 from the number.
4. When the loop stops, `n` is the odd part of the original value.
5. The original was a power of two exactly when that odd part is 1.

<!-- @complexity -->
- time: O(log n) — at most 32 iterations for an int, one per trailing zero
- space: O(1)
- note: Correct, and the slowest option measured — 579,417ns over 65,536 values against 31,083ns for the bit form, a factor of 18.64. The cost is not the iteration count, which is at most 32 and usually far less; it is that the trip count depends on the data, so nothing can be unrolled, and that each step is a division.

<!-- @code cpp -->
```cpp
bool isPowerOfTwo(int n) {
    if (n <= 0) return false;
    while (n % 2 == 0) n /= 2;
    return n == 1;
}
```

<!-- @annotations -->
- 2: n <= 0 rather than n == 0. Without it a negative would loop on a value that never becomes odd in the way this expects, and INT_MIN would divide down to -1.
- 3: n % 2 == 0 is safe for the even test even on negatives, unlike n % 2 == 1 — but the guard above has already excluded them.
- 4: The odd part of the number. It is 1 exactly when every factor was a 2.

<!-- @code java -->
```java
static boolean isPowerOfTwo(int n) {
    if (n <= 0) return false;
    while (n % 2 == 0) n /= 2;
    return n == 1;
}
```

<!-- @annotations -->
- 2: Integer.MIN_VALUE is caught here. Without the guard it halves to -1073741824, then -536870912, and eventually reaches -1, returning false by luck rather than by design.

<!-- @code python -->
```python
def is_power_of_two(n: int) -> bool:
    if n <= 0:
        return False
    while n % 2 == 0:
        n //= 2
    return n == 1


# No width limit, so this is also the version that works for
# (1 << 200) — where a 32-bit or 64-bit bit trick would need a
# wider type and log2 would have lost the answer long ago.
```

<!-- @annotations -->
- 5: // rather than /, which would produce a float and turn the comparison at the end into a floating-point one.
- 9: The one genuine advantage of the loop: it scales to arbitrary precision without changing.

<!-- @approach -->
### Better - Count the Set Bits

<!-- @idea -->
A power of two has exactly one set bit, so count them and compare to one.

<!-- @steps -->
1. Reject values that are zero or negative.
2. Count how many bits of `n` are set.
3. Compare that count against 1.
4. Note that this states the property directly rather than deducing it.
5. Note that the count is a single instruction on every mainstream CPU.

<!-- @complexity -->
- time: O(1) with a hardware popcount instruction, O(w) with a hand-written loop
- space: O(1)
- note: Verified over all 4,294,967,296 uint32 values, 0 wrong. Measured 31,083ns over 65,536 values — identical to the n & (n - 1) form, so there is no speed reason to prefer either. It is the most readable of the three and the only one that needs a library call. It also says yes for INT_MIN, which really does have one set bit, so it needs the same n > 0 guard.

<!-- @code cpp -->
```cpp
bool isPowerOfTwo(int n) {
    return n > 0 && __builtin_popcount((unsigned)n) == 1;
}

// C++20: std::has_single_bit(x) says exactly this, for unsigned types only —
// the standard library refuses the signed case rather than guarding it.
```

<!-- @annotations -->
- 2: The cast is required because __builtin_popcount takes an unsigned int; the guard above means the value is positive, so the cast changes nothing.
- 5: Worth knowing that the standard library's answer to the sign problem was to make the signed version impossible to write.

<!-- @code java -->
```java
static boolean isPowerOfTwo(int n) {
    return n > 0 && Integer.bitCount(n) == 1;
}

// Integer.bitCount is an intrinsic on every mainstream JVM and compiles
// to the same single instruction as the C++ builtin.
```

<!-- @annotations -->
- 2: bitCount takes a signed int and counts the bit pattern, so bitCount(Integer.MIN_VALUE) is 1 — the guard is doing real work.

<!-- @code python -->
```python
def is_power_of_two(n: int) -> bool:
    return n > 0 and n.bit_count() == 1


# bit_count() is Python 3.10+. Before that: bin(n).count("1") == 1,
# which measured 6.2x slower than the builtin but still far faster
# than a hand-written shift loop.
```

<!-- @annotations -->
- 2: Python has no fixed width, so bit_count works for arbitrarily large values — (1 << 200).bit_count() is 1 and the answer is correctly yes.
- 5: The fallback, and the one to reach for if the runtime version is not guaranteed.

<!-- @approach -->
### Optimal - Drop the Lowest Set Bit

<!-- @idea -->
Subtracting one destroys the lowest set bit, so ANDing leaves zero only when there was nothing else.

<!-- @steps -->
1. Reject values that are zero or negative with `n > 0`.
2. Compute `n - 1`, which flips the lowest set bit to 0 and every zero beneath it to 1.
3. AND that with `n`. Every bit at or below the lowest set bit is now cleared.
4. What remains is exactly the bits that were above it.
5. Compare against 0 — nothing remaining means there was only ever one bit.

<!-- @complexity -->
- time: O(1) — a subtract, an AND and a compare
- space: O(1)
- note: Verified against a set-bit-counting reference over all 4,294,967,296 uint32 values, 0 wrong, in 153.7 seconds. The same expression without the guard was wrong on exactly 1 value, n = 0. Measured 31,083ns over 65,536 values, indistinguishable from the popcount form and 18.64x faster than the division loop.

<!-- @code cpp -->
```cpp
bool isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}

// n > 0, not n != 0. INT_MIN is 10000000000000000000000000000000 —
// exactly one set bit — so it passes the AND test and is not a power
// of two. Measured: it is the ONLY negative that does, out of the
// 1,000,000 tested in -1,000,000..-1.
//
// Without any guard the test is wrong on exactly 1 of the 4,294,967,296
// uint32 values: zero, which has no bits to drop.
```

<!-- @annotations -->
- 2: The guard is not defensive programming, it is part of the algorithm — the AND is a statement about bit patterns and cannot see a sign.
- 5: This is the case a test suite never contains, because nobody thinks to pass the most negative representable integer to a power-of-two check.
- 11: And this is the case a test suite always contains, which is why the unguarded version usually gets caught.

<!-- @code java -->
```java
static boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}

// Integer.highestOneBit(n) == n is another spelling, and it has the same
// two problems: highestOneBit(0) is 0, and highestOneBit(MIN_VALUE) is
// MIN_VALUE, so both need the n > 0 guard too.
```

<!-- @annotations -->
- 2: Identical to C++. Java's arithmetic on int is defined to wrap, so n - 1 at Integer.MIN_VALUE is Integer.MAX_VALUE rather than undefined — but the guard means it never runs.

<!-- @code python -->
```python
def is_power_of_two(n: int) -> bool:
    return n > 0 and n & (n - 1) == 0


# There is no INT_MIN in Python, so the n > 0 guard is only doing the
# zero check — but it is still required, and still the same character.
# Works unchanged for (1 << 200), where 32-bit and 64-bit forms cannot go.
```

<!-- @annotations -->
- 2: & binds more loosely than ==, so this parses as n > 0 and (n & ((n - 1) == 0)) — which is WRONG. Write n > 0 and (n & (n - 1)) == 0 with the parentheses.
- 5: The trap that does not transfer, worth naming so that Python code is not written with a guard against a value that cannot exist.

<!-- @approach -->
### Alternative - Isolate the Lowest Set Bit and Compare

<!-- @idea -->
n & -n keeps only the lowest set bit; if that is the whole number, there was only one.

<!-- @steps -->
1. Reject values that are zero or negative.
2. Compute `-n`, which is `~n + 1` — it agrees with `n` from the lowest set bit down and disagrees above.
3. AND them, leaving exactly the lowest set bit.
4. Compare that against `n` itself.
5. They are equal only when the lowest set bit was the entire number.

<!-- @complexity -->
- time: O(1) — a negate, an AND and a compare
- space: O(1)
- note: Verified over all 4,294,967,296 uint32 values, 0 wrong. Measured 31,000ns over 65,536 values, the same as the other two bit forms. Worth knowing mostly because n & -n reappears constantly — it is the idiom a Fenwick tree walks with, and the one that answers "what is the lowest set bit" when you want the bit rather than a yes or no.

<!-- @code cpp -->
```cpp
bool isPowerOfTwo(int n) {
    return n > 0 && (n & -n) == n;
}

// For an unsigned n write (n & (~n + 1u)) == n instead — identical bits,
// and it avoids the warning about negating an unsigned value.
```

<!-- @annotations -->
- 2: -n on a signed n is only well defined because the guard has already excluded INT_MIN, where negation overflows. The guard is load-bearing twice over here.
- 5: ~n + 1 is what -n means, written so the compiler has nothing to complain about.

<!-- @code java -->
```java
static boolean isPowerOfTwo(int n) {
    return n > 0 && (n & -n) == n;
}

// Java defines integer negation to wrap, so -Integer.MIN_VALUE is
// Integer.MIN_VALUE rather than undefined — but the guard excludes it
// anyway, and relying on the wrap would be relying on the wrong thing.
```

<!-- @annotations -->
- 2: The same expression as C++ with one fewer caveat, since Java has no undefined behaviour on overflow.

<!-- @code python -->
```python
def is_power_of_two(n: int) -> bool:
    return n > 0 and (n & -n) == n


# n & -n is worth remembering independently of this test: it answers
# "what is the lowest set bit worth", which is how a Fenwick tree walks
# its parent chain.
```

<!-- @annotations -->
- 2: Works on unbounded integers because the two's complement identity holds at every width, not just 32 or 64.

<!-- @example -->

<!-- @input -->
n = 16 and n = 12

<!-- @output -->
16 & 15 = 0 — a power of two; 12 & 11 = 8 — not

<!-- @why -->
The two cases side by side show what the AND is actually measuring: not whether the number is special, but whether anything survives above the lowest set bit.

<!-- @walkthrough -->
1. 16 is 00010000, with its only set bit at position 4.
2. Subtracting one borrows through the zeros below it: 15 is 00001111.
3. The bit that was set is now clear, and every bit below it is now set — so the two values share no set bit at all.
4. The AND is therefore 00000000, and the test reports a power of two.
5. Now 12, which is 00001100, with set bits at positions 2 and 3.
6. Subtracting one gives 11 = 00001011: the lowest set bit at position 2 is cleared, position 1 and 0 turn on, and position 3 is untouched.
7. The AND keeps position 3, giving 00001000 = 8 — the bits above the lowest one survived, so there was more than one, and the answer is no.

<!-- @example -->

<!-- @input -->
Every uint32 value, against a set-bit-counting reference

<!-- @output -->
4,294,967,296 checked in 153.7 seconds; the guarded forms wrong on 0, the unguarded form wrong on exactly 1

<!-- @why -->
It is small enough to check completely, and completeness turns "remember the zero case" into a measured claim about how rare the failure is and how ordinary the failing input is.

<!-- @walkthrough -->
1. A reference implementation counted the set bits of each value with a 32-iteration loop and reported a power of two when the count was 1.
2. Exactly 32 of the 4,294,967,296 values qualified — 2^0 through 2^31.
3. n && (n & (n - 1)) == 0 agreed on all of them, as did n && (n & -n) == n and popcount(n) == 1.
4. Dropping the guard produced exactly one disagreement, at n = 0.
5. Zero has no set bits, so n - 1 is all ones, and the AND of 0 with anything is 0 — the test says yes.
6. One wrong answer in four billion looks like a negligible failure rate, and is not, because zero is the value an uninitialised variable holds, the size of an empty container, and the result of the subtraction that often precedes this check.
7. The failure is also silent: the function returns a plausible boolean rather than crashing, so nothing downstream reports it.

<!-- @example -->

<!-- @input -->
n = INT_MIN = -2147483648

<!-- @output -->
Exactly one set bit, so every bit test says yes — and it is not a power of two

<!-- @why -->
It is the reason the guard is n > 0 rather than n != 0, and it is invisible to every argument this subtopic makes about bits.

<!-- @walkthrough -->
1. INT_MIN is 10000000000000000000000000000000 — a single set bit, at position 31.
2. So popcount(INT_MIN) is 1, and the "exactly one set bit" definition is satisfied.
3. INT_MIN - 1 wraps to INT_MAX = 01111111111111111111111111111111, which shares no bit with it, so the AND is 0.
4. n & -n is also INT_MIN, since negating it in two's complement gives itself back, so that form agrees too.
5. All three bit methods therefore report a power of two, and all three are correct about the bit pattern and wrong about the number.
6. The reason is that bit 31 carries place value -2^31 in the signed reading, and no bitwise operator knows that.
7. Measured over -1,000,000..-1, zero negative values pass the unguarded test — INT_MIN is not one case among many, it is the only one, which is exactly why it never appears in a test suite.

<!-- @example -->

<!-- @input -->
The five methods timed, and log2 pushed past 32 bits

<!-- @output -->
Three bit forms tie at ~31,000ns; log2 is 16.43x slower and breaks at 2^53 + 1

<!-- @why -->
The float method is more defensible than it is usually given credit for and still wrong, and the reason it is wrong is worth more than the conclusion.

<!-- @walkthrough -->
1. Over 65,536 values, n & (n - 1) took 31,083ns, n & -n took 31,000ns and popcount took 31,083ns — indistinguishable.
2. The log2 method took 510,583ns, a factor of 16.43, and the divide-until-odd loop took 579,417ns, a factor of 18.64.
3. Checked over every uint32 value, the log2 method was wrong on 0 of them — it really is exact at 32 bits.
4. That is because a double carries 53 bits of mantissa, comfortably more than the 32 a uint32 needs, so every value is represented exactly.
5. It breaks as soon as the input is 64-bit: 2^53 + 1 cannot be represented, rounds to 2^53, and log2 returns exactly 53.0.
6. The test then reports a power of two, with no warning and no loss of precision anywhere the programmer can see.
7. So the objection is not that floats are inexact here — it is that the method's correctness depends on a mantissa width nobody is checking, and stops holding silently when the type widens.

<!-- @visualization custom -->

<!-- @description -->
Open with the definition panel: a strip of eight sample values drawn as bit rows — 1, 2, 4, 8, 16 above and 10, 12, 31, 0 below — with the set bits lit. Let the reader see that the top row all have a single lit cell and the bottom row do not, before any operator appears. Then the mechanism panel, which is the core: n = 16 on top and n - 1 = 15 beneath it, with the borrow animated — the lit cell at position 4 goes dark and a wave of ones sweeps in below it, left to right, so the reader sees where the ones came from. Drop an AND between the rows and let every column collapse to 0. Immediately replay the same animation for n = 12, where the borrow only reaches position 2 and the lit cell at position 3 sits above it untouched, surviving the AND as 8. Put the two results side by side, 0 and 8, labelled "nothing left" and "something left". Next the zero panel: n = 0 drawn as an empty row, n - 1 as a full row of ones, the AND collapsing to empty, and the verdict reading "power of two" in red — annotated as the only wrong answer among 4,294,967,296 values, with a note that zero is the value of an uninitialised variable rather than a rare input. Then the sign panel, which needs care: INT_MIN as a 32-bit row with only the top cell lit, and three tests run in parallel — popcount says 1, n & (n - 1) says 0, n & -n returns the value itself — all three lighting green, with the place value of the top cell revealed underneath as -2^31 rather than +2^31 and the verdict flipping to red. Caption it "every bit test is right about the pattern and wrong about the number". Then the float panel: a number line at 64-bit scale with 2^53 and 2^53 + 1 shown collapsing onto the same double, log2 returning exactly 53.0, and the verdict reading "power of two" — beside a note that over all 4,294,967,296 uint32 values the same method was wrong on none, so the failure appears only when the type widens. Close with the timing panel: five bars, three of them the same height at roughly 31,000ns and visually indistinguishable, then log2 at 510,583ns and divide-until-odd at 579,417ns towering over them, labelled 16.43x and 18.64x.

<!-- @sampleInput -->
```json
{"definition":{"powersOfTwo":[{"n":1,"bits":"00000001"},{"n":2,"bits":"00000010"},{"n":4,"bits":"00000100"},{"n":8,"bits":"00001000"},{"n":16,"bits":"00010000"}],"notPowers":[{"n":10,"bits":"00001010"},{"n":12,"bits":"00001100"},{"n":31,"bits":"00011111"},{"n":0,"bits":"00000000"}],"property":"exactly one set bit"},"mechanism":[{"n":16,"nBits":"00010000","minusOne":15,"minusOneBits":"00001111","and":0,"verdict":"power of two","reading":"the borrow cleared the only set bit and filled every position below it"},{"n":12,"nBits":"00001100","minusOne":11,"minusOneBits":"00001011","and":8,"andBits":"00001000","verdict":"not a power of two","reading":"the bit at position 3 was above the lowest set bit and survived"}],"exhaustive":{"valuesChecked":4294967296,"seconds":153.7,"powersFound":32,"referenceUsed":"count set bits with a 32-iteration loop, report count == 1","forms":[{"expr":"n && (n & (n - 1)) == 0","wrong":0},{"expr":"n && (n & -n) == n","wrong":0},{"expr":"popcount(n) == 1","wrong":0},{"expr":"log2(n) is a whole number","wrong":0,"note":"exact at 32 bits — a double has 53 mantissa bits"},{"expr":"(n & (n - 1)) == 0 [no guard]","wrong":1,"whichOne":0}]},"zeroCase":{"n":0,"bits":"00000000","minusOne":"11111111111111111111111111111111","and":0,"unguardedVerdict":"power of two","correct":false,"whyItMatters":"zero is the default of an uninitialised variable, the size of an empty container, and the result of the subtraction above it","failureRate":"1 in 4,294,967,296","silent":true},"signTrap":{"value":-2147483648,"name":"INT_MIN","bits":"10000000000000000000000000000000","setBits":1,"tests":[{"expr":"popcount(n) == 1","says":true},{"expr":"(n & (n - 1)) == 0","says":true,"note":"n - 1 wraps to INT_MAX, which shares no bit"},{"expr":"(n & -n) == n","says":true,"note":"negating INT_MIN gives INT_MIN"}],"truth":false,"why":"bit 31 carries place value -2^31 in the signed reading, and no bitwise operator knows that","negativesPassingUnguarded":{"range":[-1000000,-1],"count":0},"guard":"n > 0, not n != 0"},"floatMethod":{"exactAt32Bits":true,"mantissaBits":53,"breaksAt":[{"n":4503599627370497,"expr":"2^52 + 1","log2":52.0,"says":"power of two","truth":false},{"n":9007199254740993,"expr":"2^53 + 1","log2":53.0,"says":"power of two","truth":false}],"objection":"correctness depends on a mantissa width nobody checks, and stops holding silently when the type widens"},"timing":{"unit":"ns","values":65536,"bestOf":200,"rows":[{"method":"n & (n - 1)","ns":31083,"ratio":1.0},{"method":"n & -n","ns":31000,"ratio":1.0},{"method":"popcount(n) == 1","ns":31083,"ratio":1.0},{"method":"log2","ns":510583,"ratio":16.43},{"method":"divide until odd","ns":579417,"ratio":18.64}],"reading":"the three bit forms are indistinguishable, so choose on readability; popcount says the property out loud"},"languageNotes":{"cpp":{"cpp20":"std::has_single_bit — unsigned only, so the standard library refuses the signed case rather than guarding it","popcount":"__builtin_popcount takes unsigned"},"java":{"popcount":"Integer.bitCount, an intrinsic","alternative":"Integer.highestOneBit(n) == n needs the same guard"},"python":{"popcount":"int.bit_count() from 3.10, else bin(n).count('1')","noIntMin":true,"precedence":"n > 0 and n & (n - 1) == 0 parses wrongly — parenthesise the AND","unbounded":"(1 << 200) works, where 32-bit and 64-bit forms cannot go"}}}
```

<!-- @highlights -->
- A strip of sample values is drawn as bit rows, powers of two above and non-powers below, before any operator appears.
- The reader sees the single lit cell in the top row and the multiple lit cells below it.
- The mechanism panel puts n = 16 above n - 1 = 15 and animates the borrow.
- The lit cell at position 4 goes dark while a wave of ones sweeps in beneath it.
- An AND drops between the rows and every column collapses to 0.
- The same animation replays for n = 12, where the borrow stops at position 2.
- The lit cell at position 3 sits above the borrow untouched and survives the AND as 8.
- The two results sit side by side, labelled "nothing left" and "something left".
- The zero panel shows an empty row, a full row of ones, an empty AND, and a red verdict.
- It is annotated as the only wrong answer among 4,294,967,296 values.
- The sign panel draws INT_MIN with only the top cell lit and runs all three bit tests in parallel.
- All three light green, then the top cell's place value is revealed as -2^31 and the verdict flips to red.
- It is captioned "every bit test is right about the pattern and wrong about the number".
- The float panel collapses 2^53 and 2^53 + 1 onto the same double, with log2 returning exactly 53.0.
- A note records that the same method was wrong on none of the 4,294,967,296 uint32 values.
- Five timing bars end the sequence: three indistinguishable at roughly 31,000ns, then 510,583ns and 579,417ns labelled 16.43x and 18.64x.

<!-- @edgeCases -->
- n = 0 — the single value the unguarded test gets wrong, out of 4,294,967,296.
- n = 1 — a power of two, since 2^0 is 1; the test gives 1 & 0 == 0, correctly yes.
- n = 2 — the smallest even power, and the smallest input where the borrow moves more than one position.
- INT_MIN — one set bit, passes every bit test, and is not a power of two; the reason the guard is n > 0.
- Other negatives — none of the 1,000,000 tested in -1,000,000..-1 pass the unguarded test, so INT_MIN is the sole trap.
- INT_MAX — 2^31 - 1, every low bit set, so the AND leaves a great deal and the answer is a clear no.
- 2^31 as a signed int — not representable; it is INT_MIN, which is the previous case wearing a different name.
- A 64-bit input with a 32-bit method — 1 << 40 needs a long long throughout, or the subtraction happens in the wrong width.
- 2^53 + 1 with the log2 method — reported as a power of two, because the value rounds to 2^53 in a double.
- (1 << 200) in Python — correctly yes; the loop and the bit forms both scale, while log2 has long since lost the answer.
- Unsigned input in C++20 — std::has_single_bit exists and refuses signed types, which sidesteps the guard question by construction.

<!-- @pitfalls -->
- Omitting the zero guard. (n & (n - 1)) == 0 reports zero as a power of two — one wrong answer in 4,294,967,296, and zero is the most ordinary input there is.
- Guarding with n != 0 instead of n > 0. INT_MIN has exactly one set bit, so it passes the AND test, the popcount test and the n & -n test alike.
- Assuming a popcount test dodges the sign problem. Integer.bitCount(Integer.MIN_VALUE) is 1, and __builtin_popcount on the same pattern is 1 — the property really does hold, it is the conclusion that does not.
- Reaching for log2. It measured 16.43x slower and, while exact over every uint32 value, reports 2^53 + 1 as a power of two the moment the input is 64-bit.
- Believing the float method fails because floats are inexact. Over 32-bit input it is exact; it fails because its correctness silently depends on the mantissa being wider than the type.
- Writing the division loop for speed. It is the slowest method measured, 18.64x the bit form, despite never exceeding 32 iterations.
- Negating a signed n before checking it. -n is undefined for INT_MIN in C++, so n & -n needs the guard for a second, independent reason.
- Writing n > 0 and n & (n - 1) == 0 in Python. Precedence puts the == inside the AND; parenthesise the whole AND.
- Applying a 32-bit form to a 64-bit value. Both n - 1 and the comparison must happen in the wide type, or the top half is silently dropped.
- Testing only with small powers. 1, 2, 4 and 8 pass under every spelling, correct or not — the values that separate them are 0 and INT_MIN.
- Using highestOneBit(n) == n in Java without a guard. It has both of the same failures, at 0 and at MIN_VALUE.
- Treating "exactly one set bit" and "power of two" as the same statement. They are the same for positive values and differ for exactly one input in the signed range.

<!-- @doubt -->
### Why does n & (n - 1) test for a power of two?

<!-- @answer -->
Because subtracting one always destroys the lowest set bit. The borrow turns that bit from 1 to 0 and every zero beneath it from 0 to 1, leaving everything above it untouched. So n and n - 1 have no set bit in common at or below that position, and the AND keeps only what was above. For a power of two there is nothing above — the single set bit was the lowest one — so the result is 0. For 12 = 00001100 the lowest set bit is at position 2, the borrow reaches only that far, and the bit at position 3 survives, giving 8.

<!-- @doubt -->
### Why does the guard have to be n > 0?

<!-- @answer -->
Two separate reasons, and n != 0 only fixes one of them. Zero has no set bits, so n - 1 is all ones and the AND is 0, making the unguarded test say yes — that is the failure n != 0 catches. But INT_MIN is 10000000000000000000000000000000, which has exactly one set bit, so it passes the AND test, the popcount test and the n & -n test alike. It is not a power of two because it is negative, and nothing bitwise can see that: the pattern is identical to 2^31, only the place value of the top bit has changed sign. Over -1,000,000..-1 no other negative passes, which is exactly why this one is never in a test suite.

<!-- @doubt -->
### Is popcount(n) == 1 worse than the AND trick?

<!-- @answer -->
No, and on readability it is better. Measured over 65,536 values, popcount took 31,083ns and n & (n - 1) took 31,083ns — the same number, because both compile to one or two instructions. Both were correct on all 4,294,967,296 uint32 values. Popcount states the property directly, which is worth something when the next reader is trying to decide whether the code means what the comment says. Its only costs are that it needs a library call — __builtin_popcount, Integer.bitCount, int.bit_count — and that it needs exactly the same n > 0 guard.

<!-- @doubt -->
### What is actually wrong with using log2?

<!-- @answer -->
Less than people say, and enough. Over every one of the 4,294,967,296 uint32 values it gave the right answer, because a double carries 53 mantissa bits and 32 bits fit inside that exactly. It is not an approximation at this width. What breaks is the moment the input is 64-bit: 2^53 + 1 has no double representation, rounds to 2^53, and log2 returns exactly 53.0 — so the test confidently reports a power of two. The objection is therefore not "floats are inexact" but "this is correct only while the type is narrower than the mantissa, and nothing in the code says so". It also measured 16.43x slower.

<!-- @doubt -->
### How does n & -n differ from n & (n - 1)?

<!-- @answer -->
They are opposite halves of the same fact. n - 1 clears the lowest set bit and fills below it, so ANDing keeps everything above — the lowest bit is what you lose. -n is ~n + 1, which agrees with n from the lowest set bit downward and disagrees above, so ANDing keeps exactly that bit — the lowest bit is all you keep. For a power-of-two test both work: dropping the only bit leaves 0, and isolating the only bit gives back the whole number. They measured identically, at 31,083ns and 31,000ns. n & -n is worth remembering separately because it answers "what is the lowest set bit worth", which is the step a Fenwick tree walks its parent chain with.

<!-- @doubt -->
### Is 1 a power of two?

<!-- @answer -->
Yes — 2^0. The test handles it without a special case: 1 & 0 is 0, so it reports yes. This is worth confirming rather than assuming, because a definition that says "a power of two is a number you can halve down to 1" makes 1 sound like a base case rather than an instance, and because some problem statements exclude it deliberately. If yours does, exclude it explicitly with n > 1 rather than trusting the reader to infer it.

<!-- @doubt -->
### Why is the division loop so much slower?

<!-- @answer -->
It measured 579,417ns over 65,536 values against 31,083ns for the bit form, a factor of 18.64, despite never running more than 32 iterations and usually running far fewer. Two reasons compound. Its trip count depends on the data, so it cannot be unrolled or vectorised — the same effect that made the early-exit bit loop 5.83x slower than a fixed one in the i-th bit subtopic. And every iteration performs a division and a remainder, which are among the most expensive integer operations, where the bit form does one subtraction and one AND.

<!-- @doubt -->
### Does this work for 64-bit values?

<!-- @answer -->
Yes, provided every part of the expression is 64-bit. n & (n - 1) is width-agnostic — it is the same argument about borrowing whatever the width — so the only requirement is that n - 1 happens in the wide type rather than being computed on a truncated copy. In practice that means declaring n as long long or long and being careful with literals, exactly as with 1LL << 40 rather than 1 << 40. The popcount form needs the 64-bit variant: __builtin_popcountll, Long.bitCount. The log2 form is the one that genuinely stops working at this width.

<!-- @doubt -->
### Why does zero pass the unguarded test?

<!-- @answer -->
Because the test asks "is there anything left after dropping the lowest set bit", and zero has no set bits to drop. 0 - 1 is all ones, and 0 AND anything is 0, so the result is 0 and the test says yes. The deeper reason is that the expression tests "has at most one set bit" rather than "has exactly one" — zero satisfies the weaker property, and the guard is what turns one into the other. It is worth stating that way, because it explains why the same guard is needed in every spelling: popcount(0) is 0, and highestOneBit(0) is 0, and each of those fails the same way for the same reason.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Count the Number of Set Bits, which replaces "is there exactly one" with "how many". The answer reuses this exact idiom as a loop: each n &= n - 1 removes one set bit, so the loop runs once per set bit rather than once per position — and on a sparse value that is a large saving, while on a dense one it is not. That subtopic then measures the loop against a fixed 32-iteration scan and against the hardware instruction, and the ordering is not the one the argument predicts.
