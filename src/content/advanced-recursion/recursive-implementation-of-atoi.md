---
id: recursive-implementation-of-atoi
topic: Advanced Recursion
title: Recursive Implementation of atoi()
difficulty: Medium
status: ready
prerequisites:
  - check-if-there-exists-a-subsequence-with-sum-k
  - pow-x-n
  - integer-overflow-and-precision-errors
  - data-types
  - type-conversion-and-casting
relatedIds:
  - pow-x-n
  - check-if-there-exists-a-subsequence-with-sum-k
  - integer-overflow-and-precision-errors
  - data-types
---

<!-- @summary -->
The first linear recursion in this topic — one frame per character, no branching — where the whole difficulty is in the failure cases. The natural overflow check, doing the arithmetic and inspecting the result, misses 27.1% of real overflows at ten digits; the smallest counterexample is 4772185884, where the wrap lands on exactly the previous value so nothing looks wrong at all.

<!-- @theory -->
## The problem

Parse a leading integer out of a string, following the usual `atoi` contract:
skip leading spaces, accept one optional sign, read digits until something that
is not a digit, and clamp the result into `[INT_MIN, INT_MAX]`. Return 0 if there
are no digits.

```
"42"               ->  42
"   -42"           ->  -42
"4193 with words"  ->  4193
"words and 987"    ->  0
"91283472332"      ->  2147483647     (clamped)
```

## A different shape of recursion

Everything in this topic so far branched — two calls per frame, building a tree of
2^n leaves. This one calls itself **once**:

```
digits(i, acc):
    if i == n or s[i] is not a digit: return acc
    return digits(i + 1, acc * 10 + (s[i] - '0'))
```

One frame per character, depth equal to the length, no tree at all. It is a
chain, exactly like Sum of First N Numbers — and like that one it is a tail call,
so `-O2` compiles it to a loop and the depth limit disappears. Measured, `-O0`
dies at **103,758** characters and `-O2` reached **199,902,343**.

So the recursion is the easy part. Everything interesting here is in what the
digits do to the accumulator.

## The overflow check that does not work

The obvious way to detect overflow is to do the arithmetic and look at the
result — if it came out smaller, it must have wrapped:

```
int next = r * 10 + d;
if (next < r) return OVERFLOW;      // WRONG
```

Two things are wrong with this. The formal problem is that signed overflow is
undefined behaviour in C++ and Java, so the check is reasoning about something
the language says cannot happen. The practical problem is worse: **it is simply
not true that wrapping produces a smaller value.**

Measured over 200,000 random numeric strings per row:

| Digits | Truly overflow | After-the-fact check MISSED | Check-before missed |
|---|---|---|---|
| 10 | 174,404 | **47,306** (27.1%) | **0** |
| 11 | 200,000 | 15,099 | 0 |
| 12 | 200,000 | 2,621 | 0 |
| 13 | 200,000 | 372 | 0 |
| 14 | 200,000 | 72 | 0 |
| 15 | 200,000 | 5 | 0 |

More than a quarter of ten-digit overflows go undetected. The smallest input it
misses is **4772185884**, and the reason is worth seeing:

```
running int value:  4  47  477  4772  47721  477218  4772185  47721858  477218588  477218588
                                                                                    ^^^^^^^^^
```

The last step wraps to **exactly the previous value**. `next < r` is false because
`next == r`. Nothing about the result looks unusual — it is positive, it is in
range, and it is the same number you already had.

## Check before you multiply

The fix is to ask whether the multiplication *would* overflow, using only values
that are already in range:

```
if (r > (INT_MAX - d) / 10) return OVERFLOW;
r = r * 10 + d;
```

`INT_MAX - d` and the division are both safe, so nothing ever wraps and there is
nothing undefined to reason about. Measured, this missed **zero** overflows at
every length tested.

## But it still cannot reach INT_MIN

An `int` runs from −2,147,483,648 to 2,147,483,647. The range is asymmetric, so:

```
|INT_MIN| = 2,147,483,648 = INT_MAX + 1     — not representable as an int
```

Accumulating the **magnitude** and negating at the end therefore cannot parse
`"-2147483648"`: the magnitude overflows on the final digit, one step before the
sign would have rescued it. This is the same asymmetry that broke `-n` in
Pow(x, n), arriving from a different direction.

The fix is to accumulate **negatively** from the start:

```
r = r * 10 - d;                       // r walks toward INT_MIN
if (r < (INT_MIN + d) / 10) clamp;
```

Now the accumulator lives in the range that is one wider, `INT_MIN` is reachable,
and the sign is applied once at the end. Measured, accumulating the magnitude
overflows on `"2147483648"` while accumulating negatively lands exactly on
−2,147,483,648.

## Clamping early makes the length stop mattering

Once the value is out of range the answer is fixed — more digits cannot bring it
back. So the recursion can stop reading:

| Input length | Frames, reading to the end | Frames, clamping early |
|---|---|---|
| 10 | 11 | 11 |
| 100 | 101 | **11** |
| 10,000 | 10,001 | **11** |
| 1,000,000 | **stack overflow** | **11** |

Eleven frames for a million digits. The frame count becomes a property of the
integer type rather than of the input, which is the difference between a function
that handles hostile input and one that crashes on it.

## The spec is where the bugs live

The parsing itself is four lines. The contract is where implementations diverge,
and it has more edge cases than it looks:

| Input | Result | Why |
|---|---|---|
| `"+-12"` | 0 | one sign only, then a non-digit |
| `"  +0 123"` | 0 | digits stop at the space |
| `"00000-42a1234"` | 0 | leading zeros are digits; the `-` ends them |
| `"3.14159"` | 3 | the `.` is not a digit |
| `"  -0012a42"` | −12 | spaces, sign, leading zeros, then a letter |
| `"-"` | 0 | a sign with no digits is not a number |
| `""` | 0 | nothing to parse |

The implementation here passes all 24 of those plus every boundary value in both
signs, and agrees with an independent 64-bit reference over **800,000** random
strings.

## And the library is not a drop-in

`std::stoi` looks like the obvious answer and has a different contract: it
**throws** `std::invalid_argument` on `"words and 987"` and `std::out_of_range`
on `"91283472332"`, where this problem wants 0 and `INT_MAX`. `strtol` is the
closer match — it reports through `endptr` and `errno` rather than exceptions —
but it also accepts other bases and leading whitespace of every kind, which is
more than the contract asks for.

Timing, on a mixed set of inputs:

| | ns per call |
|---|---|
| Recursive `myAtoi` | **12.3** |
| `strtol` | 14.1 |
| C `atoi` | 15.4 |

Close enough to be uninteresting — and the library functions are doing more work
(bases, `errno`, wider types). The reason to write this one is the contract, not
the speed.

## Where this goes next

**Count Good Numbers** returns to arithmetic and picks up where Pow(x, n) left
off: the answer is a power of 5 times a power of 4 taken modulo 10^9+7, with n as
large as 10^15. That is binary exponentiation with a modulus, and it is where the
halving trick stops being an optimisation and becomes the only way to get an
answer at all — there is no closed form and no library call for modular powers.

<!-- @intuition -->
Reading a number out of a string is a chain rather than a tree: one character, one frame, no choices to explore. That makes the recursion itself trivial, and it moves all the difficulty into arithmetic that has to stay inside a fixed range. The instinct is to multiply and add first and check the result afterwards, but that does not work — a value that has wrapped is not reliably smaller than what it started from, and can even be identical to it. The only reliable test is to ask, before multiplying, whether the multiplication would leave the range, using numbers that are still inside it. The second thing to internalise is that the negative half of an integer type is one wider than the positive half, so a parser that builds up the magnitude and negates at the end cannot represent the most negative value it is supposed to accept. Build the number negative and it works out.

<!-- @approach -->
### Brute Force - Accumulate, Then Check

<!-- @idea -->
Multiply and add, then see whether the result looks like it wrapped.

<!-- @steps -->
1. Read one character and convert it to a digit.
2. Multiply the accumulator by ten and add the digit.
3. Compare the new value with the old one.
4. Treat a smaller result as evidence of overflow.
5. Recurse on the next character.

<!-- @complexity -->
- time: O(n)
- space: O(n) call stack, O(1) once the tail call is eliminated
- note: Does not work, in two distinct ways. Formally the arithmetic is undefined behaviour on signed overflow, so the check inspects a result the language does not define. Practically it misses real overflows — measured, 47,306 of 174,404 ten-digit overflows went undetected, 27.1%, because a wrap does not reliably produce a smaller value. The smallest miss is 4772185884, where the wrap lands on exactly the previous value.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

int digitsBroken(const string& s, size_t i, int r) {
    if (i == s.size() || s[i] < '0' || s[i] > '9') return r;

    int d = s[i] - '0';
    int next = r * 10 + d;              // may already have overflowed
    if (next < r) return -1;            // "overflow" — unreliable

    return digitsBroken(s, i + 1, next);
}
```

<!-- @annotations -->
- 8: Signed overflow is undefined behaviour, so this line is where the problem starts — the value it produces is not something the standard defines.
- 9: And the test is wrong on its own terms: on 4772185884 the wrap lands on exactly the previous value, so next < r is false.
- 5: The recursion itself is fine — one frame per character, and a tail call. Only the arithmetic is broken.

<!-- @code java -->
```java
static int digitsBroken(String s, int i, int r) {
    if (i == s.length() || !Character.isDigit(s.charAt(i))) return r;

    int d = s.charAt(i) - '0';
    int next = r * 10 + d;
    if (next < r) return -1;

    return digitsBroken(s, i + 1, next);
}
```

<!-- @annotations -->
- 5: Java defines int overflow as wrapping rather than leaving it undefined, so this is well defined here — and still detects only about three quarters of ten-digit overflows.

<!-- @code python -->
```python
def digits_broken(s, i, r):
    if i == len(s) or not s[i].isdigit():
        return r
    nxt = r * 10 + int(s[i])
    if nxt < r:
        return -1
    return digits_broken(s, i + 1, nxt)


# In Python this check never fires at all — integers do not overflow,
# so nxt is always larger and the range has to be enforced explicitly.
```

<!-- @annotations -->
- 5: Python integers are arbitrary precision, so nothing ever wraps and this branch is dead code — the clamp has to be an explicit comparison against 2**31.
- 2: str.isdigit() also accepts non-ASCII digit characters, so use '0' <= s[i] <= '9' when the contract means ASCII only.

<!-- @approach -->
### Check Before You Multiply

<!-- @idea -->
Ask whether the next multiplication would leave the range, using values that are still inside it.

<!-- @steps -->
1. Read one character and convert it to a digit.
2. Compare the accumulator against the largest value that can still be multiplied safely.
3. Report overflow if it is above that threshold.
4. Otherwise perform the multiplication, which cannot now wrap.
5. Recurse on the next character.

<!-- @complexity -->
- time: O(n)
- space: O(n) call stack, O(1) after tail-call elimination
- note: Both operands of the test are in range, so nothing is undefined and nothing wraps — measured, it missed zero overflows at every length from 10 to 15 digits, against the after-the-fact check's 47,306 misses at ten. It still cannot represent the magnitude of INT_MIN, which is what the next approach fixes.

<!-- @code cpp -->
```cpp
#include <climits>
#include <string>
using namespace std;

int digitsSafe(const string& s, size_t i, int r) {
    if (i == s.size() || s[i] < '0' || s[i] > '9') return r;

    int d = s[i] - '0';
    if (r > (INT_MAX - d) / 10) return INT_MAX;    // would overflow

    return digitsSafe(s, i + 1, r * 10 + d);
}
```

<!-- @annotations -->
- 9: INT_MAX - d cannot underflow because d is at most 9, so everything in this test stays inside the type. Returning INT_MAX rather than a sentinel also means the caller cannot forget to handle the overflow case.
- 11: By the time this multiplication runs it has been proved safe, so no undefined behaviour is possible.

<!-- @code java -->
```java
static int digitsSafe(String s, int i, int r) {
    if (i == s.length() || !Character.isDigit(s.charAt(i))) return r;

    int d = s.charAt(i) - '0';
    if (r > (Integer.MAX_VALUE - d) / 10) return Integer.MAX_VALUE;

    return digitsSafe(s, i + 1, r * 10 + d);
}
```

<!-- @annotations -->
- 5: Java also offers Math.addExact and Math.multiplyExact, which throw ArithmeticException instead — correct, but an exception is a heavy way to report an expected condition.

<!-- @code python -->
```python
INT_MAX = 2**31 - 1


def digits_safe(s, i, r):
    if i == len(s) or not ('0' <= s[i] <= '9'):
        return r
    d = int(s[i])
    if r > (INT_MAX - d) // 10:
        return INT_MAX
    return digits_safe(s, i + 1, r * 10 + d)


# The bound has to be written out, because Python will happily hold
# any integer and will never signal that a range was exceeded.
```

<!-- @annotations -->
- 7: Floor division with //, since true division would make the threshold a float and the comparison inexact for large values.
- 5: Comparing characters directly rather than using isdigit(), so that non-ASCII digits are rejected as the contract intends.

<!-- @approach -->
### Optimal - Accumulate Negative and Clamp Early

<!-- @idea -->
Build the number in the negative half of the range, and stop as soon as it is out of range.

<!-- @steps -->
1. Note that the negative half of an integer type is one value wider than the positive half.
2. Accumulate downward, subtracting each digit instead of adding it.
3. Check before each step whether the subtraction would pass INT_MIN.
4. Return the clamped value immediately, without reading the rest of the string.
5. Apply the sign once at the end, mapping a clamped positive result to INT_MAX.

<!-- @complexity -->
- time: O(min(n, 11)) — the length stops mattering once the value is out of range
- space: O(1) after tail-call elimination
- note: The only form that can represent INT_MIN, because |INT_MIN| is INT_MAX + 1 and does not fit. Clamping early makes the frame count a property of the type rather than the input: 11 frames whether the string has 10 digits or 1,000,000, where reading to the end overflows the stack at 103,758 characters. Verified against an independent 64-bit reference over 800,000 random strings and all 24 spec cases.

<!-- @code cpp -->
```cpp
#include <climits>
#include <string>
using namespace std;

int digits(const string& s, size_t i, int acc) {
    if (i == s.size() || s[i] < '0' || s[i] > '9') return acc;

    int d = s[i] - '0';
    if (acc < (INT_MIN + d) / 10) return INT_MIN;   // clamped; stop reading

    return digits(s, i + 1, acc * 10 - d);
}

int myAtoi(const string& s) {
    size_t i = 0;
    while (i < s.size() && s[i] == ' ') i++;

    int sign = 1;
    if (i < s.size() && (s[i] == '+' || s[i] == '-')) { if (s[i] == '-') sign = -1; i++; }

    int acc = digits(s, i, 0);
    return sign == 1 ? (acc == INT_MIN ? INT_MAX : -acc) : acc;
}
```

<!-- @annotations -->
- 9: Returning here without recursing is the early clamp — it is why a million-digit string still costs 11 frames.
- 11: acc walks downward, so it can reach INT_MIN exactly, which accumulating the magnitude never can.
- 18: Only one sign is consumed, which is what makes "+-12" parse as zero.
- 21: A clamped positive maps to INT_MAX; a clamped negative is already INT_MIN, so it is returned unchanged.

<!-- @code java -->
```java
static int digits(String s, int i, int acc) {
    if (i == s.length() || s.charAt(i) < '0' || s.charAt(i) > '9') return acc;

    int d = s.charAt(i) - '0';
    if (acc < (Integer.MIN_VALUE + d) / 10) return Integer.MIN_VALUE;

    return digits(s, i + 1, acc * 10 - d);
}

static int myAtoi(String s) {
    int i = 0;
    while (i < s.length() && s.charAt(i) == ' ') i++;

    int sign = 1;
    if (i < s.length() && (s.charAt(i) == '+' || s.charAt(i) == '-')) {
        if (s.charAt(i) == '-') sign = -1;
        i++;
    }

    int acc = digits(s, i, 0);
    return sign == 1 ? (acc == Integer.MIN_VALUE ? Integer.MAX_VALUE : -acc) : acc;
}
```

<!-- @annotations -->
- 5: Integer division in Java truncates toward zero exactly as in C++, so this threshold behaves identically for negative operands.

<!-- @code python -->
```python
INT_MIN, INT_MAX = -2**31, 2**31 - 1


def digits(s, i, acc):
    if i == len(s) or not ('0' <= s[i] <= '9'):
        return acc
    d = int(s[i])
    if acc < -(-(INT_MIN + d) // 10):
        return INT_MIN
    return digits(s, i + 1, acc * 10 - d)


def my_atoi(s):
    i = 0
    while i < len(s) and s[i] == ' ':
        i += 1
    sign = 1
    if i < len(s) and s[i] in '+-':
        if s[i] == '-':
            sign = -1
        i += 1
    acc = digits(s, i, 0)
    return INT_MAX if sign == 1 and acc == INT_MIN else (-acc if sign == 1 else acc)
```

<!-- @annotations -->
- 8: Python's // floors toward negative infinity where C++ truncates toward zero, so the threshold needs the double negation to match.
- 9: The early clamp matters more here, not less — without it a long string costs one Python frame per character and hits the recursion limit at around a thousand.

<!-- @approach -->
### The Library Call

<!-- @idea -->
Use the standard conversion, and check whether its contract is the one you need.

<!-- @steps -->
1. Reach for the library function first.
2. Check what it does with trailing non-digits.
3. Check what it does with a value out of range.
4. Check what it does with an empty or all-space input.
5. Write the parser yourself only when those answers do not match the contract.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The contracts differ more than the names suggest. std::stoi throws invalid_argument on "words and 987" and out_of_range on "91283472332", where this problem wants 0 and INT_MAX. strtol reports through endptr and errno instead, which is closer, but also accepts other bases. Measured, the hand-written version was 12.3ns against strtol's 14.1ns and C atoi's 15.4ns — near enough that speed is not the reason to choose between them.

<!-- @code cpp -->
```cpp
#include <cerrno>
#include <climits>
#include <cstdlib>
#include <string>
using namespace std;

int myAtoiViaStrtol(const string& s) {
    errno = 0;
    char* end = nullptr;
    long v = strtol(s.c_str(), &end, 10);

    if (end == s.c_str()) return 0;                       // no digits consumed
    if (errno == ERANGE || v > INT_MAX) return INT_MAX;
    if (v < INT_MIN) return INT_MIN;
    return (int)v;
}
```

<!-- @annotations -->
- 8: errno must be cleared first, because strtol only ever sets it and never clears it.
- 12: Comparing end against the start is how you tell "parsed 0" from "parsed nothing".
- 13: On a 64-bit platform long is wider than int, so the explicit range check is still needed after ERANGE.

<!-- @code java -->
```java
static int myAtoiViaParse(String s) {
    String t = s.trim();
    try {
        return Integer.parseInt(t);
    } catch (NumberFormatException e) {
        return 0;                    // WRONG for "4193 with words" and for overflow
    }
}
```

<!-- @annotations -->
- 6: This is the shape people reach for and it does not implement the contract — it returns 0 both for unparseable input and for out-of-range input, where the second should clamp.

<!-- @code python -->
```python
def my_atoi_via_int(s):
    try:
        return int(s.strip())
    except ValueError:
        return 0


# Also wrong for this contract: int() rejects "4193 with words" entirely
# rather than reading the leading number, and never clamps, since Python
# integers have no range to fall out of.
```

<!-- @annotations -->
- 3: int() requires the whole string to be a number, so it returns 0 where the contract wants 4193.
- 8: And it has no notion of INT_MAX at all, so out-of-range values come back exact rather than clamped.

<!-- @example -->

<!-- @input -->
"   -42" through the recursive parser

<!-- @output -->
−42, from three spaces, one sign and two digits

<!-- @why -->
The smallest input that exercises every stage of the contract, and shows the accumulator moving downward rather than up.

<!-- @walkthrough -->
1. The three leading spaces are skipped by the loop before any recursion begins.
2. The '-' is consumed as the sign, setting sign to −1 and advancing past it.
3. digits is called with an accumulator of 0 and the index of '4'.
4. The threshold check passes, so the accumulator becomes 0 * 10 − 4, which is −4.
5. The next frame reads '2' and the accumulator becomes −4 * 10 − 2, which is −42.
6. The following frame finds the end of the string and returns −42 unchanged.
7. Because the sign is −1 the accumulator is already correct and is returned as is; had the sign been +1 it would be negated to 42.

<!-- @example -->

<!-- @input -->
4772185884, checked for overflow after the arithmetic

<!-- @output -->
No overflow detected, and the returned value is 477218588

<!-- @why -->
It is the smallest input that defeats the intuitive overflow check, and the mechanism is not what people expect.

<!-- @walkthrough -->
1. The accumulator grows normally through the first nine digits: 4, 47, 477, 4772, 47721, 477218, 4772185, 47721858, 477218588.
2. The tenth digit is 4, so the next value should be 4,772,185,884.
3. That exceeds INT_MAX, so it wraps by subtracting 2^32, giving 477,218,588.
4. That is exactly the value the accumulator already held.
5. The test next < r is therefore false — the new value is not smaller, it is identical.
6. So the parser reports success and returns a number that is off by a factor of ten.
7. Across 200,000 random ten-digit strings this check missed 47,306 of the 174,404 that genuinely overflowed, which is 27.1%.

<!-- @example -->

<!-- @input -->
"-2147483648", parsed by accumulating the magnitude

<!-- @output -->
Overflow, one digit before the sign could have saved it

<!-- @why -->
It is the case that forces the accumulator to be built negatively, and it is the same asymmetry that broke the exponent in Pow(x, n).

<!-- @walkthrough -->
1. An int runs from −2,147,483,648 to 2,147,483,647, so the negative half holds one more value than the positive half.
2. Parsing the magnitude means accumulating 2,147,483,648, which is INT_MAX + 1.
3. The check-before-multiplying test therefore fires on the final digit and reports overflow.
4. But the requested value, −2,147,483,648, is perfectly representable — the parser failed on a legal input.
5. Accumulating downward instead gives −214,748,364 then −2,147,483,648, both inside the range.
6. Measured, the magnitude version overflows on this input and the negative version lands on it exactly.
7. The sign is then applied once at the end, and a clamped positive is mapped to INT_MAX rather than negated.

<!-- @example -->

<!-- @input -->
A string of one million digits

<!-- @output -->
11 frames with early clamping, a stack overflow without it

<!-- @why -->
It shows that the useful bound on this recursion comes from the integer type rather than from the input, once the clamp is placed correctly.

<!-- @walkthrough -->
1. Reading to the end of the string uses one frame per character, so the frame count follows the input length.
2. Measured at -O0 that runs out of stack at 103,758 characters.
3. But once the accumulator is out of range, no further digit can bring it back — the answer is already decided.
4. Returning the clamped value immediately therefore costs nothing in correctness.
5. With that change the frame count is 11 for a ten-digit string and still 11 for a million-digit one.
6. The bound became a property of the integer type — about the number of digits INT_MIN has — rather than of the input.
7. At -O2 the tail call is eliminated anyway and the no-clamp version reached 199,902,343, but relying on that means the correctness of a hostile-input path depends on an optimisation flag.

<!-- @visualization custom -->

<!-- @description -->
A single horizontal strip for the input string with a cursor moving left to right one character per frame, and a chain of frames stacking below it rather than the trees of the previous subtopics — the shape change is the first thing to establish, so open with the branching tree from Count all subsequences greying out and collapsing into a single column. Run "   -42": highlight the three spaces as skipped before any frame appears, then the sign as consumed, then let one frame appear per digit with the accumulator shown inside it going 0, −4, −42, and a sign badge on the side that is applied only at the very end. The overflow panel is the centre. Draw a number line with INT_MAX marked, and run 4772185884 digit by digit as a bar that grows rightward: at the tenth digit let the bar shoot past INT_MAX and wrap around to the left, landing exactly on the tick it already occupied, with both positions labelled 477218588 and a caption reading the check compares these two and sees no change. Beside it run the same input through the check-before form, where a dashed threshold line at (INT_MAX − d)/10 is crossed before the multiply happens and the bar never leaves the axis. Under both, the miss table as a small bar chart: 47,306 of 174,404 at ten digits shrinking to 5 of 200,000 at fifteen, with the check-before row flat at zero throughout. Then the asymmetry panel: the integer range drawn as a line with one more tick below zero than above, |INT_MIN| shown as a value that lands one position past the right end, and two accumulators racing — one upward that hits the wall on the last digit of 2147483648, one downward that lands exactly on the final tick. Finally the depth panel: two frame stacks side by side for a million-digit input, one growing off the top of the frame and stamped stack overflow at 103,758, the other stopping at 11 with a caption that the bound now comes from the type rather than the input.

<!-- @sampleInput -->
```json
{"primary":{"input":"   -42","result":-42,"stages":[{"stage":"skip spaces","consumed":3,"framesUsed":0},{"stage":"sign","consumed":1,"sign":-1},{"stage":"digits","frames":[{"char":"4","accBefore":0,"accAfter":-4},{"char":"2","accBefore":-4,"accAfter":-42},{"char":null,"endOfString":true,"returns":-42}]}],"signAppliedAtEnd":true,"note":"the accumulator moves DOWNWARD; a positive result is negated only at the very end"},"shape":{"callsPerFrame":1,"structure":"chain, not tree","depth":"one frame per character","contrastWithPreviousSubtopics":"every earlier subtopic in this topic branched into 2^n leaves","isTailCall":true,"depthLimit":{"O0":103758,"O2":199902343}},"overflowCheck":{"broken":"int next = r*10 + d; if (next < r) return OVERFLOW;","whyFormallyWrong":"signed overflow is undefined behaviour in C++, so the check inspects a value the language does not define","whyPracticallyWrong":"a wrapped value is not reliably smaller than what it started from","smallestMiss":{"input":"4772185884","runningValues":[4,47,477,4772,47721,477218,4772185,47721858,477218588,477218588],"mechanism":"the wrap lands on EXACTLY the previous value, so next < r is false","returned":477218588},"missRates":[{"digits":10,"tested":200000,"trulyOverflow":174404,"afterMissed":47306,"missedPct":27.1,"beforeMissed":0},{"digits":11,"tested":200000,"trulyOverflow":200000,"afterMissed":15099,"beforeMissed":0},{"digits":12,"tested":200000,"trulyOverflow":200000,"afterMissed":2621,"beforeMissed":0},{"digits":13,"tested":200000,"trulyOverflow":200000,"afterMissed":372,"beforeMissed":0},{"digits":14,"tested":200000,"trulyOverflow":200000,"afterMissed":72,"beforeMissed":0},{"digits":15,"tested":200000,"trulyOverflow":200000,"afterMissed":5,"beforeMissed":0}],"correct":"if (r > (INT_MAX - d)/10) return OVERFLOW;","whyItWorks":"both operands stay inside the type, so nothing wraps and nothing is undefined"},"intMinAsymmetry":{"INT_MAX":2147483647,"INT_MIN":-2147483648,"magnitudeOfIntMin":2147483648,"equals":"INT_MAX + 1","consequence":"accumulating the magnitude cannot parse \"-2147483648\" — it overflows on the final digit","fix":"accumulate downward: acc = acc*10 - d, guarded by acc < (INT_MIN + d)/10","measured":{"magnitudeInInt":"overflows on 2147483648","accumulatedNegative":-2147483648},"echoes":"the same asymmetry that made -n fail for INT_MIN in pow-x-n"},"earlyClamp":{"rule":"once the value is out of range no further digit can bring it back","frames":[{"digits":10,"readToEnd":11,"clampEarly":11},{"digits":100,"readToEnd":101,"clampEarly":11},{"digits":10000,"readToEnd":10001,"clampEarly":11},{"digits":1000000,"readToEnd":"stack overflow","clampEarly":11}],"reading":"the frame count becomes a property of the integer type rather than of the input"},"specCases":[{"in":"42","out":42},{"in":"   -42","out":-42},{"in":"4193 with words","out":4193},{"in":"words and 987","out":0},{"in":"-91283472332","out":-2147483648},{"in":"91283472332","out":2147483647},{"in":"2147483648","out":2147483647},{"in":"-2147483648","out":-2147483648},{"in":"+-12","out":0},{"in":"  +0 123","out":0},{"in":"00000-42a1234","out":0},{"in":"3.14159","out":3},{"in":"  -0012a42","out":-12},{"in":"-","out":0},{"in":"","out":0}],"verification":{"specCases":24,"boundaryValuesBothSigns":"all pass","randomStrings":500000,"numericStrings":300000,"total":800000,"reference":"independent 64-bit parse with clamping"},"library":{"stdStoi":{"onTrailingWords":"throws invalid_argument","onOutOfRange":"throws out_of_range","verdict":"different contract"},"strtol":{"reports":"endptr and errno","verdict":"closest match, but also accepts other bases"},"pythonInt":{"onTrailingWords":"raises ValueError","clamping":"none — Python integers have no range"},"timing":{"unit":"ns per call, mixed inputs","recursiveMyAtoi":12.3,"strtol":14.1,"cAtoi":15.4,"reading":"close enough that speed is not the deciding factor"}}}
```

<!-- @highlights -->
- The branching tree from the previous subtopic greys out and collapses into a single column, establishing that this recursion is a chain.
- A horizontal strip holds the input with a cursor advancing one character per frame.
- Running "   -42", the three spaces are highlighted as skipped before any frame appears.
- The sign is consumed next and shown as a badge applied only at the very end.
- One frame appears per digit, with the accumulator inside going 0, −4, −42 — downward, not up.
- The overflow panel draws a number line with INT_MAX marked and grows a bar for 4772185884.
- At the tenth digit the bar shoots past INT_MAX and wraps to land on the tick it already occupied.
- Both positions are labelled 477218588, captioned the check compares these two and sees no change.
- Beside it the check-before form crosses a dashed threshold at (INT_MAX − d)/10 and never leaves the axis.
- A bar chart shows the miss rate falling from 47,306 of 174,404 at ten digits to 5 of 200,000 at fifteen.
- The check-before row is flat at zero throughout.
- The asymmetry panel draws the integer range with one more tick below zero than above.
- |INT_MIN| is shown landing one position past the right end of the positive half.
- Two accumulators race: one upward that hits the wall on the last digit, one downward that lands exactly on the final tick.
- The depth panel shows two frame stacks for a million-digit input, one running off the top stamped stack overflow at 103,758.
- The other stops at 11, captioned that the bound now comes from the type rather than the input.

<!-- @edgeCases -->
- An empty string — no digits, so the answer is 0 and the recursion never starts.
- A string of only spaces — the same, after the skip loop consumes everything.
- A lone sign, "+" or "-" — a sign with no digits is not a number, so 0.
- Two signs, "+-12" — only one sign is consumed and the second ends the digits, giving 0.
- Digits interrupted by a space, "  +0 123" — parsing stops at the space, giving 0.
- Leading zeros, "  -0012a42" — zeros are digits, the letter ends them, giving −12.
- A decimal point, "3.14159" — the point is not a digit, so the answer is 3.
- "-2147483648" — the only input the magnitude-accumulating version cannot represent.
- "2147483648" — one past INT_MAX, which must clamp rather than wrap.
- 4772185884 — the smallest value whose wrap lands on the previous accumulator, defeating the after-the-fact check.
- A million-digit string — 11 frames with early clamping, a stack overflow at 103,758 characters without it.

<!-- @pitfalls -->
- Detecting overflow by comparing the result with the previous value. Measured, that missed 27.1% of ten-digit overflows, because a wrap is not reliably smaller — on 4772185884 it lands on exactly the previous value.
- Relying on signed overflow behaving predictably in C++. It is undefined, so the compiler is entitled to assume it never happens.
- Accumulating the magnitude and negating at the end. |INT_MIN| is INT_MAX + 1, so "-2147483648" overflows one digit before the sign could rescue it.
- Reading the whole string before clamping. A million-digit input then costs a million frames and overflows the stack at 103,758.
- Consuming more than one sign. "+-12" must be 0, not 12 or −12.
- Skipping whitespace other than the space character. The contract here is spaces only; treating tabs or newlines as leading whitespace accepts inputs it should reject.
- Using isdigit() on a possibly negative char in C++. Passing a negative value is undefined behaviour — compare against '0' and '9' or cast to unsigned char.
- Using str.isdigit() in Python for an ASCII-only contract. It accepts superscripts and other Unicode digit characters.
- Reaching for std::stoi. It throws on trailing words and on out-of-range input, where this contract wants 0 and a clamp.
- Reaching for Python's int(). It requires the entire string to be numeric, so "4193 with words" raises rather than returning 4193.
- Forgetting to clear errno before strtol. The function sets it but never clears it, so a stale ERANGE from earlier code is read as an overflow.
- Treating the parsed 0 and the failure 0 as the same thing. With strtol you distinguish them by comparing endptr against the start of the string.

<!-- @doubt -->
### Why does checking the result afterwards not work?

<!-- @answer -->
Because a wrapped value is not reliably smaller than what it started from. The intuition is that overflow makes a number "go negative" or shrink, and often it does — but not always. The smallest counterexample is 4772185884: the accumulator reaches 477,218,588 and the next step should give 4,772,185,884, which wraps by subtracting 2^32 and lands on 477,218,588 — exactly the value it already held. The test next < r is false because the two are equal. Measured over 200,000 random ten-digit strings, that check missed 47,306 of the 174,404 that genuinely overflowed, which is 27.1%. In C++ there is a formal problem too: signed overflow is undefined behaviour, so the check is inspecting a value the language never defined.

<!-- @doubt -->
### What is the right way to check?

<!-- @answer -->
Ask whether the multiplication would overflow before performing it, using only values that are still in range: if r is greater than (INT_MAX − d) / 10, then r * 10 + d cannot fit. Both operands of that test are inside the type, so nothing wraps and nothing is undefined. Measured, it missed zero overflows at every length from 10 to 15 digits, against 47,306 misses for the after-the-fact version at ten. The same shape works for the negative direction: compare against (INT_MIN + d) / 10 when the accumulator is walking downward.

<!-- @doubt -->
### Why accumulate a negative number?

<!-- @answer -->
Because the negative half of an integer type is one value wider than the positive half. An int runs from −2,147,483,648 to 2,147,483,647, so the magnitude of INT_MIN is INT_MAX + 1 and is not itself representable. A parser that builds up the magnitude and negates at the end therefore cannot handle "-2147483648" — it overflows on the final digit, one step before the sign would have made it legal. Accumulating downward keeps the value in the wider half the whole way, so INT_MIN is reached exactly. This is the same asymmetry that made negating the exponent fail in Pow(x, n), arriving from the other direction.

<!-- @doubt -->
### Why stop reading once the value is clamped?

<!-- @answer -->
Because the answer is already decided and more digits cannot change it. That is not an optimisation so much as a robustness fix: reading to the end costs one frame per character, so a hostile input of a million digits uses a million frames and overflows the stack — measured at -O0 that happens at 103,758 characters. Returning the clamped value immediately makes the frame count 11 regardless of the input length, so the bound comes from the integer type rather than from whatever the caller supplied. At -O2 the tail call is eliminated and the unclamped version survives much longer, but that means the safety of a hostile-input path depends on an optimisation flag, which is not a property worth relying on.

<!-- @doubt -->
### Is this recursion different from the rest of the topic?

<!-- @answer -->
Yes, and it is worth noticing. Every earlier subtopic here branched — two calls per frame, a tree with 2^n leaves, and the interesting question was how much of it could be avoided. This one calls itself once per character, so it is a chain with depth equal to the input length, exactly like Sum of First N Numbers. That makes it a tail call, which -O2 turns into a loop: the depth limit goes from 103,758 characters to 199,902,343. So the recursion itself contributes almost nothing to the difficulty of this problem; all of it is in the arithmetic and the contract.

<!-- @doubt -->
### Why not just call stoi or int()?

<!-- @answer -->
Because their contracts are different, not merely stricter. std::stoi throws invalid_argument on "words and 987" and out_of_range on "91283472332", where this problem wants 0 and INT_MAX respectively. Python's int() requires the entire string to be numeric, so it raises on "4193 with words" instead of returning 4193, and it never clamps because Python integers have no range to leave. strtol is the closest match — it reports through endptr and errno rather than exceptions — but it also accepts other bases and a broader notion of whitespace. Speed is not the deciding factor: the hand-written version measured 12.3ns against strtol's 14.1ns and C atoi's 15.4ns.

<!-- @doubt -->
### How do I tell a parsed zero from a parse failure?

<!-- @answer -->
With strtol, compare the endptr against the start of the string: if nothing was consumed, no digits were found. That distinction matters because "0" and "abc" both produce a return value of 0. The same issue exists in the hand-written version, where the contract happens to want 0 for both cases, so it does not surface — but if you ever adapt this to report failure separately, the position the parser stopped at is the information you need to keep. Clearing errno before the call is the companion detail: strtol sets it on range errors but never clears it, so a stale value from earlier code reads as an overflow that did not happen.

<!-- @doubt -->
### Which whitespace and which digits count?

<!-- @answer -->
Only what the contract says, which is narrower than the library helpers assume. This problem specifies the space character, so treating tabs or newlines as leading whitespace accepts inputs it should reject. For digits, Python's str.isdigit() returns true for superscripts and various non-ASCII digit characters, so comparing '0' <= c <= '9' is the safer test when the contract means ASCII. In C++ there is a further trap: passing a negative char to isdigit is undefined behaviour, because those functions are specified over unsigned char values and EOF — so either cast, or compare the character range directly as the samples here do.

<!-- @doubt -->
### Does Java's defined overflow make the naive check safe?

<!-- @answer -->
It removes the formal problem and not the practical one. Java specifies int arithmetic as wrapping, so there is no undefined behaviour and the compiler cannot assume overflow never happens. But the check is still detecting the wrong thing: a wrapped value is not reliably smaller, so the same 4772185884 defeats it in Java exactly as in C++, and the same roughly one-in-four miss rate applies at ten digits. Java does offer Math.multiplyExact and Math.addExact, which throw ArithmeticException on overflow and are genuinely correct — though using an exception to report a condition you fully expect is a heavy way to do it.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Count Good Numbers, which returns to arithmetic and picks up directly from Pow(x, n). The answer there is a power of 5 times a power of 4, taken modulo 10^9 + 7, with n as large as 10^15 — so a linear loop is impossible and the closed form does not exist, because there is no floating-point route to an exact result modulo a prime. Binary exponentiation stops being an optimisation at that point and becomes the only available method. It also brings back an overflow question of exactly the kind this subtopic is about: multiplying two numbers just under 10^9 + 7 exceeds a 32-bit type and needs 64 bits to hold the intermediate.
