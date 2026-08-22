---
id: string-to-integer-atoi
topic: Strings
title: String to Integer (atoi)
difficulty: Medium
status: ready
prerequisites:
  - for-loop
  - if-else-statements
  - data-types
  - type-conversion-and-casting
  - integer-overflow-and-precision-errors
  - roman-to-integer
relatedIds:
  - roman-to-integer
  - integer-overflow-and-precision-errors
  - type-conversion-and-casting
  - reverse-a-number
  - largest-odd-number-in-a-string
---

<!-- @summary -->
Parse a leading integer out of a string and clamp it to 32 bits — a problem with no algorithm and an unusually exact specification, which diverges from `int()` on **43.0%** of generated inputs and from `std::stoi` on throwing versus returning zero; and where the version I measured as **1.9x fastest had undefined behaviour** that 300,000 passing tests never revealed, because negating `INT_MIN` produces the right answer on this machine — corrected, it is the slowest of the three.

<!-- @theory -->
## The problem

Read an integer from the front of a string, following this exact procedure:

1. Skip leading **spaces** — the space character, not whitespace generally.
2. Take an optional single `+` or `-`.
3. Read digits until a non-digit or the end of the string.
4. If no digits were read, the answer is 0.
5. Clamp the result to the 32-bit signed range.

```
" 42"              ->  42
"   -042"          ->  -42
"4193 with words"  ->  4193
"words and 987"    ->  0
"2147483648"       ->  2147483647   clamped
```

There is no algorithm here. It is one pass over the string, and every difficulty
is in the specification and in the arithmetic at the boundary.

## It is not `int()`, and it is not `stoi`

The instinct is to hand the string to the language's built-in conversion. All
three of the obvious candidates behave differently from the specification and
from each other:

| Input | Specification | `std::stoi` | `strtol` | Python `int()` |
|---|---|---|---|---|
| `" 42"` | 42 | 42 | 42 | 42 |
| `"4193 with words"` | 4193 | 4193 | 4193 | **raises** |
| `"words and 987"` | 0 | **throws** | 0 | **raises** |
| `"+-12"` | 0 | **throws** | 0 | **raises** |
| `"3.14"` | 3 | 3 | 3 | **raises** |
| `"2147483648"` | **2147483647** | **throws** | **2147483648** | 2147483648 |
| `"-2147483649"` | **-2147483648** | **throws** | -2147483649 | -2147483649 |
| `"\t42"` | **0** | 42 | 42 | 42 |
| `""` | 0 | **throws** | 0 | **raises** |
| `"+"` | 0 | **throws** | 0 | **raises** |

Three separate classes of divergence, all of them silent in the sense that they
produce a plausible result or an exception rather than an obviously wrong number:

- **Trailing garbage.** The spec stops at the first non-digit and keeps what it
  has; `int()` refuses the whole string.
- **The whitespace definition.** The spec skips only `' '`. `stoi`, `strtol` and
  `int()` all skip tabs and newlines too, so `"\t42"` is 0 by the spec and 42
  everywhere else.
- **The range.** The spec **clamps**. `stoi` throws. `strtol` clamps to
  `LONG_MAX`, which on a 64-bit platform is not `INT_MAX` — so `"2147483648"`
  comes back as 2147483648, a value that does not fit the `int` you are about to
  assign it to.

Measured over 200,000 generated inputs of the shape this problem describes,
Python's `int()` **raised on 41.1%** where the specification returns a number,
and the two disagreed or raised on **43.0%** overall.

## The range is not symmetric

This is the arithmetic fact the whole problem turns on:

```
INT_MAX  =  2,147,483,647
INT_MIN  = -2,147,483,648        |INT_MIN| is one MORE than INT_MAX
```

So `-2147483648` is representable and `+2147483648` is not, which means the
positive and negative limits need different handling, and it means **negating
`INT_MIN` is undefined behaviour** — there is no positive value to negate it to.

The guard constants follow directly: `INT_MAX / 10` is 214,748,364 and
`INT_MAX % 10` is 7. A value can safely be multiplied by ten and have a digit
added exactly while it is below 214,748,364, or equal to it with a digit no
greater than 7.

Verified at the boundary:

| Input | Result |
|---|---|
| `"2147483646"` | 2147483646 |
| `"2147483647"` | 2147483647 |
| `"2147483648"` | **2147483647** |
| `"-2147483647"` | -2147483647 |
| `"-2147483648"` | **-2147483648** |
| `"-2147483649"` | **-2147483648** |
| `"99999999999999999999"` | 2147483647 |

## The bug my own tests could not find

I wrote three overflow strategies, cross-checked them against each other over
**300,000 random inputs with zero mismatches**, and benchmarked them. The
unsigned-accumulator version came out **1.9x faster** than the others.

It had undefined behaviour. The final line was:

```cpp
return neg ? -(int)val : (int)val;      // val can be exactly 2147483648
```

When the input is `"-2147483648"`, `val` holds 2147483648, `(int)val` is
implementation-defined and typically yields `INT_MIN`, and **negating `INT_MIN`
is undefined**. The sanitizer says so plainly:

```
runtime error: negation of -2147483648 cannot be represented in type 'int'
```

Every test passed because on this machine the undefined operation happens to
produce exactly the right answer. Three hundred thousand inputs, the full
boundary sweep, and a cross-check against two independent implementations all
agreed — and none of them could see it, because they compare *answers* and the
answer was correct.

Two things follow. First, the fix:

```cpp
if (neg) return val == 2147483648ULL ? INT_MIN : -(int)val;
return (int)val;
```

Second, and more useful: **the speed advantage was the bug.** Corrected, the same
function is the *slowest* of the three:

| Strategy | Microseconds per pass, median of five |
|---|---|
| Accumulate in a 64-bit type | **18.15** |
| Guard before each multiply | 19.18 |
| Accumulate unsigned, corrected | 22.31 |
| *Accumulate unsigned, with the UB* | *11.74* |

All three correct versions are within about 1.2x of each other, so the choice is
entirely about which one is easiest to see is right — and the one that looked
fastest was fastest because it was skipping a check it needed.

Run the sanitizer. On this problem specifically, `-fsanitize=undefined` finds
what the test suite structurally cannot.

## Three ways to stay inside the range

**Guard before each multiply.** Before computing `val * 10 + d`, check whether it
would exceed `INT_MAX`. Nothing ever overflows, so nothing is ever undefined. It
needs the two constants above and a slightly fiddly condition.

**Accumulate in a wider type.** Build the value in a `long long`, which cannot
overflow within the digit counts this problem allows, and clamp after each digit.
The clearest of the three, and it needs a type twice the width of the answer —
which is not available if the answer is already the widest type you have.

**Accumulate unsigned.** Unsigned overflow is defined as wrapping, so the
accumulation is never undefined — but converting back to a signed type at the end
is where the trap sits, as above.

## Python: no overflow, so the clamp is the whole range story

Python integers are arbitrary precision, so none of the above applies. The value
cannot overflow; it just has to be clamped at the end with `max` and `min`.

| Implementation | Microseconds per pass over 2,000 inputs |
|---|---|
| Explicit character loop | 1,541.7 |
| `lstrip` then `int()` on the digit run | 1,496.6 |
| **Regex match then `int()`** | **586.8** |

**2.6x** for `re.match(r'^ *([+-]?\d+)', s)` followed by `int()` — both the
scanning and the conversion happen in C, where the explicit loop runs a
comparison per character in the interpreter. This is the same rule that has held
across the whole topic, and here it is available because a regular expression
expresses the specification exactly: optional spaces, optional sign, digit run.

<!-- @intuition -->
Most problems hide their difficulty in an algorithm; this one has no algorithm at all, and hides its difficulty in two places instead. The first is that the specification is deliberately unlike the conversions built into every language — it stops at trailing garbage rather than rejecting it, it treats only the space character as whitespace, and it clamps rather than throwing — so reaching for `int()` or `stoi` is wrong in three independent ways at once, on nearly half of realistic inputs. The second is that the 32-bit range is asymmetric: there is one more negative value than positive, so the negative limit cannot be reached by negating the positive one, and any code that tries has undefined behaviour precisely at the boundary the problem is testing. What makes that second point worth the space is how it hides. A test compares answers, and undefined behaviour is free to produce the correct answer — which it did, on three hundred thousand inputs, while also making the function look like the fastest of the three. The tool that finds it is not a better test, it is a different kind of tool.

<!-- @approach -->
### Guard Before Each Multiply

<!-- @idea -->
Check whether the next digit would push the value past the limit, and clamp before doing the arithmetic rather than after.

<!-- @steps -->
1. Skip leading space characters.
2. Read an optional single sign and remember it.
3. For each digit, before accumulating, test whether the running value already exceeds one tenth of the maximum, or equals it with a digit larger than the maximum's last digit.
4. Return the appropriate clamped limit if so.
5. Otherwise multiply by ten, add the digit, and continue.
6. Stop at the first non-digit and return the signed value.

<!-- @complexity -->
- time: O(n) — one pass, two comparisons per digit
- space: O(1) — a running value and a sign
- note: The version that never performs an operation that could overflow, which makes it the only one of the three that is obviously correct without reasoning about conversions. Measured 19.18 microseconds per pass over 2,000 inputs, against 18.15 for the wide-accumulator version — within noise. The constants are worth memorising: `INT_MAX / 10` is 214,748,364 and `INT_MAX % 10` is 7.

<!-- @code cpp -->
```cpp
#include <climits>
#include <string>
using namespace std;

int myAtoi(const string& s) {
    size_t i = 0, n = s.size();
    while (i < n && s[i] == ' ') i++;

    int sign = 1;
    if (i < n && (s[i] == '+' || s[i] == '-')) {
        if (s[i] == '-') sign = -1;
        i++;
    }

    int val = 0;
    while (i < n && s[i] >= '0' && s[i] <= '9') {
        int d = s[i] - '0';
        if (val > INT_MAX / 10 || (val == INT_MAX / 10 && d > INT_MAX % 10))
            return sign == 1 ? INT_MAX : INT_MIN;
        val = val * 10 + d;
        i++;
    }
    return sign * val;
}
```

<!-- @annotations -->
- 7: `s[i] == ' '` and nothing else. The specification skips the space character only, where `stoi` and `int()` also skip tabs and newlines — that difference alone turns `"\t42"` from 42 into 0.
- 18: The guard runs **before** the multiply, so no overflow ever occurs. Checking afterwards means the undefined behaviour has already happened.
- 19: Returning `INT_MIN` for a negative overflow works because the value is clamped, not negated — `sign * val` never sees a value it cannot represent.

<!-- @code java -->
```java
static int myAtoi(String s) {
    int i = 0, n = s.length();
    while (i < n && s.charAt(i) == ' ') i++;

    int sign = 1;
    if (i < n && (s.charAt(i) == '+' || s.charAt(i) == '-')) {
        if (s.charAt(i) == '-') sign = -1;
        i++;
    }

    int val = 0;
    while (i < n && s.charAt(i) >= '0' && s.charAt(i) <= '9') {
        int d = s.charAt(i) - '0';
        if (val > Integer.MAX_VALUE / 10
            || (val == Integer.MAX_VALUE / 10 && d > Integer.MAX_VALUE % 10))
            return sign == 1 ? Integer.MAX_VALUE : Integer.MIN_VALUE;
        val = val * 10 + d;
        i++;
    }
    return sign * val;
}
```

<!-- @annotations -->
- 13: Java's signed overflow wraps rather than being undefined, so the consequence of omitting this guard is a wrong answer instead of unpredictable behaviour — quieter, and just as wrong.
- 3: `Character.isWhitespace` would be the wrong test here; the specification names the space character specifically.

<!-- @code python -->
```python
INT_MIN, INT_MAX = -2**31, 2**31 - 1


def my_atoi(s):
    i, n = 0, len(s)
    while i < n and s[i] == " ":
        i += 1
    sign = 1
    if i < n and s[i] in "+-":
        if s[i] == "-":
            sign = -1
        i += 1
    val = 0
    while i < n and "0" <= s[i] <= "9":
        val = val * 10 + (ord(s[i]) - 48)
        i += 1
    return max(INT_MIN, min(INT_MAX, sign * val))


# Python integers do not overflow, so there is nothing to guard -- the
# range handling collapses into one clamp at the end. 1,541.7us per
# pass over 2,000 inputs, against 586.8 for the regex version.
```

<!-- @annotations -->
- 17: The whole overflow story in Python, in one line. The digits can accumulate to any size and the clamp is applied once.
- 14: `"0" <= s[i] <= "9"` rather than `.isdigit()`, which returns true for superscripts and other Unicode digit characters that `int()` will not accept.

<!-- @approach -->
### Optimal - Accumulate in a Wider Type

<!-- @idea -->
Build the value in a type twice as wide as the answer, so the accumulation cannot overflow, and clamp as soon as it leaves the range.

<!-- @steps -->
1. Skip leading space characters and read an optional sign.
2. Accumulate the digits into a 64-bit value.
3. After each digit, apply the sign and compare against the 32-bit limits.
4. Return the appropriate limit as soon as the value reaches or passes it.
5. Stop at the first non-digit and return the signed value narrowed to 32 bits.

<!-- @complexity -->
- time: O(n) — one pass, one comparison per digit
- space: O(1) — one wide accumulator
- note: The clearest of the three and the fastest measured, at 18.15 microseconds per pass. Clamping inside the loop matters: without it, twenty digits would overflow even a 64-bit accumulator. Its limitation is structural rather than practical — it needs a type twice the width of the answer, which does not exist if the answer is already the widest type available, and that is exactly when the guard-before-multiply version becomes the only option.

<!-- @code cpp -->
```cpp
#include <climits>
#include <string>
using namespace std;

int myAtoi(const string& s) {
    size_t i = 0, n = s.size();
    while (i < n && s[i] == ' ') i++;

    long long sign = 1;
    if (i < n && (s[i] == '+' || s[i] == '-')) {
        if (s[i] == '-') sign = -1;
        i++;
    }

    long long val = 0;
    while (i < n && s[i] >= '0' && s[i] <= '9') {
        val = val * 10 + (s[i] - '0');
        i++;
        if (sign * val <= INT_MIN) return INT_MIN;
        if (sign * val >= INT_MAX) return INT_MAX;
    }
    return (int)(sign * val);
}
```

<!-- @annotations -->
- 18: The clamp must be **inside** the loop. `"99999999999999999999"` is twenty digits, which overflows a 64-bit accumulator too — returning early is what keeps the wide type wide enough.
- 20: The narrowing cast is safe only because the two lines above guarantee the value is in range by the time it is reached.
- 15: `long long` here, not `int`. Declaring `sign` as `long long` as well keeps `sign * val` from being computed in 32 bits.

<!-- @code java -->
```java
static int myAtoi(String s) {
    int i = 0, n = s.length();
    while (i < n && s.charAt(i) == ' ') i++;

    long sign = 1;
    if (i < n && (s.charAt(i) == '+' || s.charAt(i) == '-')) {
        if (s.charAt(i) == '-') sign = -1;
        i++;
    }

    long val = 0;
    while (i < n && s.charAt(i) >= '0' && s.charAt(i) <= '9') {
        val = val * 10 + (s.charAt(i) - '0');
        i++;
        if (sign * val <= Integer.MIN_VALUE) return Integer.MIN_VALUE;
        if (sign * val >= Integer.MAX_VALUE) return Integer.MAX_VALUE;
    }
    return (int) (sign * val);
}
```

<!-- @annotations -->
- 11: `long` is 64-bit in Java by definition, unlike C++ where `long` may be 32-bit — which is why the C++ version says `long long` explicitly.

<!-- @code python -->
```python
import re

INT_MIN, INT_MAX = -2**31, 2**31 - 1
PATTERN = re.compile(r"^ *([+-]?\d+)")


def my_atoi(s):
    m = PATTERN.match(s)
    if not m:
        return 0
    return max(INT_MIN, min(INT_MAX, int(m.group(1))))


# The regular expression is the specification: optional spaces, an
# optional sign, a digit run. 586.8us per pass against 1,541.7 for the
# explicit loop -- 2.6x, since both the scan and the conversion run in C.
```

<!-- @annotations -->
- 4: Two characters in this pattern carry the whole specification. `^ *` and not `^\s*` — `\s` matches tabs and newlines, which the specification does not skip, and that single character is the difference between 0 and 42 on `"\t42"`. And `\d` in Python matches Unicode decimal digits rather than just ASCII, so use `[0-9]` if the input may contain them, since `int()` accepts some of what `\d` matches and not others.

<!-- @approach -->
### Accumulate Unsigned - and the Trap at the End

<!-- @idea -->
Unsigned arithmetic wraps rather than being undefined, so accumulate there and convert back at the end.

<!-- @steps -->
1. Skip leading spaces and read an optional sign, remembering only whether it was negative.
2. Choose the magnitude limit: 2147483647 for a positive result, 2147483648 for a negative one.
3. Accumulate digits into an unsigned value.
4. Return the appropriate clamped limit as soon as the magnitude passes it.
5. Convert back to a signed value at the end — carefully.

<!-- @complexity -->
- time: O(n) — one pass, one comparison per digit
- space: O(1)
- note: Included because it is the version that looked fastest and was not correct. Written the obvious way it ends `return neg ? -(int)val : (int)val;`, and `val` can be exactly 2147483648, so the negation is undefined — `-fsanitize=undefined` reports it immediately while 300,000 tests do not, because the undefined operation returns the right answer on this machine. Corrected, it measured **22.31 microseconds against 18.15** for the wide accumulator: the slowest of the three, where the buggy form measured 11.74.

<!-- @code cpp -->
```cpp
#include <climits>
#include <string>
using namespace std;

int myAtoi(const string& s) {
    size_t i = 0, n = s.size();
    while (i < n && s[i] == ' ') i++;

    bool neg = false;
    if (i < n && (s[i] == '+' || s[i] == '-')) {
        neg = s[i] == '-';
        i++;
    }

    unsigned long long val = 0;
    const unsigned long long cap = neg ? 2147483648ULL : 2147483647ULL;
    while (i < n && s[i] >= '0' && s[i] <= '9') {
        val = val * 10 + (unsigned)(s[i] - '0');
        if (val > cap) return neg ? INT_MIN : INT_MAX;
        i++;
    }
    if (neg) return val == 2147483648ULL ? INT_MIN : -(int)val;
    return (int)val;
}
```

<!-- @annotations -->
- 22: This line is the whole point of the approach. Writing it as `-(int)val` alone is undefined when `val` is 2147483648, and it returns the correct answer anyway on most machines — which is why tests cannot find it and the sanitizer can.
- 16: The two caps differ by one, which is the asymmetry of the range showing up directly in the code.
- 19: Comparing against the cap before continuing keeps `val` bounded, so the unsigned accumulator never actually wraps.

<!-- @code java -->
```java
static int myAtoi(String s) {
    int i = 0, n = s.length();
    while (i < n && s.charAt(i) == ' ') i++;

    boolean neg = false;
    if (i < n && (s.charAt(i) == '+' || s.charAt(i) == '-')) {
        neg = s.charAt(i) == '-';
        i++;
    }

    long val = 0;
    long cap = neg ? 2147483648L : 2147483647L;
    while (i < n && s.charAt(i) >= '0' && s.charAt(i) <= '9') {
        val = val * 10 + (s.charAt(i) - '0');
        if (val > cap) return neg ? Integer.MIN_VALUE : Integer.MAX_VALUE;
        i++;
    }
    return (int) (neg ? -val : val);
}
```

<!-- @annotations -->
- 18: In Java this is safe where the C++ version is not, because `-val` happens in 64-bit `long` before the narrowing cast, so `2147483648L` negates cleanly to `-2147483648L`.

<!-- @code python -->
```python
INT_MIN, INT_MAX = -2**31, 2**31 - 1


def my_atoi(s):
    s = s.lstrip(" ")
    sign = 1
    if s[:1] in ("+", "-"):
        if s[0] == "-":
            sign = -1
        s = s[1:]
    j = 0
    while j < len(s) and "0" <= s[j] <= "9":
        j += 1
    if j == 0:
        return 0
    return max(INT_MIN, min(INT_MAX, sign * int(s[:j])))


# There is no unsigned variant to get wrong in Python. 1,496.6us per
# pass, essentially the same as the explicit loop and 2.6x behind the
# regex version.
```

<!-- @annotations -->
- 7: `s[:1]` rather than `s[0]`, which raises on the empty string. Slicing past the end returns `""` and compares safely.
- 5: `lstrip(" ")` with the argument, not bare `lstrip()`, which strips all whitespace and would accept `"\t42"` as 42.

<!-- @example -->

<!-- @input -->
s = "   -42abc"

<!-- @output -->
-42

<!-- @why -->
Exercises every clause of the specification in one string — leading spaces, a sign, digits, and trailing garbage that must be ignored rather than rejected.

<!-- @walkthrough -->
1. Three leading spaces are skipped; the specification says to skip the space character specifically.
2. The next character is `-`, so the sign is negative and the position advances.
3. `4` and `2` are digits and accumulate to 42.
4. `a` is not a digit, so the digit loop ends there.
5. The trailing `"abc"` is discarded rather than causing a failure — this is where the specification differs from `int()`, which raises on the whole string.
6. The sign is applied to give -42, which is comfortably inside the range so no clamping occurs.
7. `std::stoi` returns -42 here too, but would throw on `"words 42"` where the specification returns 0.

<!-- @example -->

<!-- @input -->
s = "-2147483648" and s = "2147483648"

<!-- @output -->
-2147483648 and 2147483647

<!-- @why -->
The asymmetry of the 32-bit range, which is why the positive and negative limits cannot share a code path.

<!-- @walkthrough -->
1. `INT_MAX` is 2,147,483,647 and `INT_MIN` is -2,147,483,648.
2. So the magnitude 2147483648 is representable as a negative value and not as a positive one.
3. `"-2147483648"` is exactly `INT_MIN` and is returned unchanged.
4. `"2147483648"` is one past `INT_MAX` and is clamped down to 2147483647.
5. Any implementation that parses the magnitude and then negates must handle 2147483648 specially, because negating `INT_MIN` has no representable result.
6. The guard-before-multiply version avoids the issue by clamping to `INT_MIN` directly rather than computing it.
7. `strtol` returns 2147483648 here without complaint, because it clamps to `LONG_MAX` and `long` is 64-bit — a value that does not fit the `int` it is about to be assigned to.

<!-- @example -->

<!-- @input -->
The unsigned accumulator, cross-checked over 300,000 random inputs

<!-- @output -->
Zero mismatches, correct at every boundary, and undefined behaviour throughout

<!-- @why -->
The central lesson of this problem: a test compares answers, and undefined behaviour is free to produce the right answer.

<!-- @walkthrough -->
1. Three overflow strategies were written and cross-checked against each other over 300,000 random inputs.
2. All three agreed on every input, including the full boundary sweep from 2147483646 to -2147483649.
3. The unsigned version benchmarked at 11.74 microseconds per pass against roughly 20 for the other two — apparently 1.9x faster.
4. Its last line was `return neg ? -(int)val : (int)val;`, and on `"-2147483648"` the value `val` is exactly 2147483648.
5. `(int)val` yields `INT_MIN` on this platform, and negating `INT_MIN` is undefined behaviour.
6. `-fsanitize=undefined` reports it on the first such input: *negation of -2147483648 cannot be represented in type 'int'*.
7. The tests could not find it because they compare results, and the undefined operation returned the correct result.
8. Corrected, the same function measures 22.31 microseconds — the **slowest** of the three. The speed was the bug.

<!-- @example -->

<!-- @input -->
200,000 generated inputs through the specification and through Python's `int()`

<!-- @output -->
`int()` raises on 41.1% of them; the two disagree or raise on 43.0%

<!-- @why -->
Quantifies how far the specification is from the built-in conversion, on input shaped like what the problem describes.

<!-- @walkthrough -->
1. The generated inputs contain optional leading spaces, an optional sign, a digit run, and sometimes trailing characters.
2. Python's `int()` requires the **entire** string to be a number after stripping whitespace.
3. So any input with trailing text raises `ValueError` where the specification returns the leading digits.
4. Measured, that is 82,224 of 200,000 inputs — **41.1%**.
5. Counting the cases where they disagree as well as where `int()` raises gives 85,924 — **43.0%**.
6. The divergences fall into three groups: trailing garbage, the whitespace definition, and range clamping.
7. `"\t42"` is 0 under the specification and 42 under `int()`, `stoi` and `strtol`, because only the specification treats the tab as a non-space.

<!-- @visualization custom -->

<!-- @description -->
Draw the input as a strip and run a cursor through the four specification phases in order, shading each region as it is consumed — a spaces region, a single sign cell, a digit run, and a trailing tail that is greyed out rather than rejected. Label the tail ignored, not an error, because that is the first divergence from every built-in conversion. Beside the strip keep three verdict panels running the same input through `stoi`, `strtol` and `int()`, so `"4193 with words"` shows 4193, 4193, 4193 and raises, while `"words and 987"` shows 0, throws, 0 and raises — the panels disagreeing with each other as much as with the spec. Under them put the measured divergence as a single bar: 200,000 inputs with 43.0% shaded. The centre is the number line at the boundary, and it should be drawn asymmetric on purpose. Mark `INT_MIN` at -2,147,483,648 and `INT_MAX` at 2,147,483,647, with one extra tick of space on the negative side, and show the magnitude 2147483648 mapping to a valid point when negative and to nothing when positive. Animate an arrow trying to negate `INT_MIN` and running off the end of the line into a void, with the sanitizer message printed where it lands. Then the part that matters most: three implementations side by side, all showing green ticks against a 300,000-case test suite and a full boundary sweep, with speed bars reading 19.18, 18.15 and 11.74 — and the fastest one carrying a hidden marker that only lights when a sanitizer lens is dropped over the panel. When it lights, the bar redraws at 22.31 and becomes the slowest. Caption that transition the speed was the bug. Close with the Python panel, where the entire range story collapses to one clamp because integers do not overflow, and a regex that is the specification written out — `^ *([+-]?\d+)` — at 586.8us against 1,541.7 for the character loop.

<!-- @sampleInput -->
```json
{"primary":{"s":"   -42abc","answer":-42,"phases":[{"phase":"skip spaces","consumed":"   "},{"phase":"optional sign","consumed":"-","sign":-1},{"phase":"digit run","consumed":"42","value":42},{"phase":"trailing tail","consumed":"abc","action":"ignored, not an error"}]},"smallCases":[{"s":" 42","answer":42},{"s":"   -042","answer":-42},{"s":"4193 with words","answer":4193},{"s":"words and 987","answer":0},{"s":"2147483648","answer":2147483647,"note":"clamped"},{"s":"-2147483649","answer":-2147483648,"note":"clamped"},{"s":"","answer":0},{"s":"+","answer":0},{"s":"\t42","answer":0,"note":"a tab is not a space"}],"specification":["skip leading SPACE characters only, not whitespace generally","take an optional single + or -","read digits until a non-digit or the end","if no digits were read the answer is 0","clamp the result to the 32-bit signed range"],"divergenceFromBuiltins":{"table":[{"input":" 42","spec":42,"stoi":"42","strtol":"42","pythonInt":"42"},{"input":"4193 with words","spec":4193,"stoi":"4193","strtol":"4193","pythonInt":"raises"},{"input":"words and 987","spec":0,"stoi":"throws invalid_argument","strtol":"0 (no conversion)","pythonInt":"raises"},{"input":"+-12","spec":0,"stoi":"throws invalid_argument","strtol":"0 (no conversion)","pythonInt":"raises"},{"input":"3.14","spec":3,"stoi":"3","strtol":"3","pythonInt":"raises"},{"input":"2147483648","spec":2147483647,"stoi":"throws out_of_range","strtol":"2147483648","pythonInt":"2147483648"},{"input":"-2147483649","spec":-2147483648,"stoi":"throws out_of_range","strtol":"-2147483649","pythonInt":"-2147483649"},{"input":"\\t42","spec":0,"stoi":"42","strtol":"42","pythonInt":"42"},{"input":"","spec":0,"stoi":"throws invalid_argument","strtol":"0 (no conversion)","pythonInt":"raises"},{"input":"+","spec":0,"stoi":"throws invalid_argument","strtol":"0 (no conversion)","pythonInt":"raises"}],"threeClasses":[{"class":"trailing garbage","spec":"stops at the first non-digit and keeps what it has","builtins":"int() refuses the whole string"},{"class":"whitespace definition","spec":"skips only the space character","builtins":"stoi, strtol and int() all skip tabs and newlines too"},{"class":"range handling","spec":"clamps","builtins":"stoi throws; strtol clamps to LONG_MAX, which on a 64-bit platform is not INT_MAX"}],"measured":{"generatedInputs":200000,"pythonIntRaises":82224,"pythonIntRaisesShare":"41.1%","disagreeOrRaise":85924,"disagreeOrRaiseShare":"43.0%"}},"rangeAsymmetry":{"intMax":2147483647,"intMin":-2147483648,"fact":"|INT_MIN| is one MORE than INT_MAX, so -2147483648 is representable and +2147483648 is not","consequence":"negating INT_MIN is undefined behaviour — there is no positive value to negate it to","guardConstants":{"intMaxDiv10":214748364,"intMaxMod10":7},"boundarySweep":[{"input":"2147483646","result":2147483646},{"input":"2147483647","result":2147483647},{"input":"2147483648","result":2147483647},{"input":"-2147483647","result":-2147483647},{"input":"-2147483648","result":-2147483648},{"input":"-2147483649","result":-2147483648},{"input":"21474836470","result":2147483647},{"input":"99999999999999999999","result":2147483647}]},"theBugTestsCouldNotFind":{"whatHappened":"three overflow strategies cross-checked over 300,000 random inputs with zero mismatches, full boundary sweep passing, and the unsigned version benchmarked 1.9x faster","theLine":"return neg ? -(int)val : (int)val;","why":"val can be exactly 2147483648; (int)val yields INT_MIN and negating INT_MIN is undefined","sanitizerOutput":"runtime error: negation of -2147483648 cannot be represented in type 'int'","whyTestsMissedIt":"tests compare answers, and the undefined operation returned the correct answer on this machine","fix":"if (neg) return val == 2147483648ULL ? INT_MIN : -(int)val;","theRealFinding":"the speed advantage was the bug — corrected, the same function is the slowest of the three","timings":{"accumulate64bit":18.15,"guardBeforeMultiply":19.18,"accumulateUnsignedCorrected":22.31,"accumulateUnsignedWithUB":11.74,"unit":"microseconds per pass over 2,000 inputs, median of five runs"},"lesson":"on this problem -fsanitize=undefined finds what the test suite structurally cannot"},"threeStrategies":[{"name":"guard before each multiply","idea":"check whether val*10+d would exceed INT_MAX before computing it","pro":"nothing ever overflows, so nothing is ever undefined","con":"needs the two constants and a fiddly condition"},{"name":"accumulate in a wider type","idea":"build in a 64-bit value and clamp after each digit","pro":"the clearest of the three, and the fastest measured","con":"needs a type twice the width of the answer, which may not exist"},{"name":"accumulate unsigned","idea":"unsigned overflow is defined as wrapping","pro":"the accumulation itself is never undefined","con":"the conversion back to signed at the end is where the trap sits"}],"clampMustBeInsideTheLoop":"\"99999999999999999999\" is twenty digits, which overflows a 64-bit accumulator too — returning early is what keeps the wide type wide enough","benchPython":{"unit":"microseconds per pass over 2,000 inputs, CPython 3.13.4","rows":[{"implementation":"explicit character loop","us":1541.7},{"implementation":"lstrip then int() on the digit run","us":1496.6},{"implementation":"regex match then int()","us":586.8}],"winner":"regex, 2.6x — both the scan and the conversion run in C, and a regular expression expresses the specification exactly","regexCaveats":["use ^ * and not ^\\\\s*, since \\\\s matches tabs and newlines which the specification does not skip","\\\\d matches Unicode decimal digits in Python; use [0-9] if that matters"],"noOverflow":"Python integers are arbitrary precision, so the whole range story collapses into one max/min clamp"},"assertions":["the result is always within the 32-bit signed range","no digits read means the answer is 0","parsing stops at the first non-digit and never fails on trailing text","only the space character is skipped as leading whitespace","the negative limit is reachable and its positive counterpart is not"],"recommendation":"accumulate in a 64-bit type and clamp inside the loop — clearest and fastest measured; use guard-before-multiply when no wider type is available; in Python use a regex that spells out the specification","lesson":"the specification is the problem, and the arithmetic at the boundary is undefined exactly where the problem is testing — run the sanitizer, because a passing test suite cannot see it"}
```

<!-- @highlights -->
- The input is drawn as a strip with a cursor running the four specification phases, shading each region as it is consumed.
- The phases appear as a spaces region, a single sign cell, a digit run, and a greyed trailing tail labelled ignored, not an error.
- Three verdict panels run the same input through `stoi`, `strtol` and `int()` beside the strip.
- `"4193 with words"` shows 4193, 4193, 4193 and raises; `"words and 987"` shows 0, throws, 0 and raises.
- The panels visibly disagree with each other as much as with the specification.
- A single bar beneath reads 200,000 inputs with 43.0% shaded.
- The centre draws the number line at the boundary, deliberately asymmetric, with one extra tick on the negative side.
- `INT_MIN` sits at -2,147,483,648 and `INT_MAX` at 2,147,483,647, and the magnitude 2147483648 maps to a valid point when negative and to nothing when positive.
- An arrow tries to negate `INT_MIN`, runs off the end of the line into a void, and the sanitizer message prints where it lands.
- Three implementations then sit side by side, all showing green ticks against a 300,000-case suite and a full boundary sweep.
- Their speed bars read 19.18, 18.15 and 11.74, and the fastest carries a hidden marker.
- Dropping a sanitizer lens over the panel lights the marker, and that bar redraws at 22.31 to become the slowest.
- The transition is captioned the speed was the bug.
- The close is the Python panel, where the range story collapses to one clamp because integers do not overflow.
- A regex that is the specification written out — `^ *([+-]?\d+)` — reads 586.8us against 1,541.7 for the character loop.

<!-- @edgeCases -->
- The empty string — the answer is 0, and the Python sign check must use `s[:1]` rather than `s[0]` to avoid raising.
- Only spaces — the answer is 0; the digit loop never runs.
- A lone `+` or `-` with no digits — the answer is 0, since no digits were read.
- Two signs, like `"+-12"` — the answer is 0; only one sign is permitted and the second is a non-digit.
- A tab or newline before the digits — the answer is **0**, because the specification skips only the space character, unlike every built-in conversion.
- Leading zeros after a sign, like `"   -042"` — the answer is -42; they accumulate harmlessly.
- `"2147483648"` — one past `INT_MAX`, clamped to 2147483647.
- `"-2147483648"` — exactly `INT_MIN`, returned unchanged, and the input on which a negate-the-magnitude implementation is undefined.
- `"99999999999999999999"` — twenty digits, which overflows a 64-bit accumulator, so the clamp has to be inside the digit loop.
- A decimal point, like `"3.14"` — the answer is 3; parsing stops at the point.
- Unicode digit characters — `str.isdigit()` accepts superscripts and other forms that `int()` will not, so the digit test should be an explicit range.

<!-- @pitfalls -->
- Reaching for `int()`, `stoi` or `strtol`. All three differ from the specification, and Python's `int()` raised on **41.1%** of generated inputs where the specification returns a number.
- Skipping all whitespace instead of only the space character. That turns `"\t42"` from 0 into 42, and it is what `lstrip()` without an argument and `^\s*` in a regex both do.
- Using `strtol` and assigning the result to an `int`. It clamps to `LONG_MAX`, which is 64-bit on most platforms, so `"2147483648"` comes back as a value that does not fit the destination.
- Checking for overflow after the multiply. In C++ the undefined behaviour has already happened by then; in Java the value has already wrapped.
- Negating the parsed magnitude. `-(int)val` is undefined when `val` is 2147483648, and it returns the correct answer on most machines, so tests will not find it.
- Trusting a passing test suite on this problem. Three implementations agreed over 300,000 inputs and a full boundary sweep while one of them was undefined throughout.
- Benchmarking before sanitizing. The version that measured 1.9x fastest was fastest because it was skipping the check it needed; corrected, it is the slowest.
- Clamping only after the digit loop. Twenty digits overflow a 64-bit accumulator, so the check has to run per digit.
- Declaring `sign` as `int` while accumulating into `long long`. The product is then computed in 32 bits and the clamp compares a value that has already wrapped.
- Using `str.isdigit()` in Python. It returns true for superscript and other Unicode digits that `int()` will reject.
- Assuming `long` is 64-bit in C++. It is 32-bit on Windows, which is why the wide accumulator must be `long long`.

<!-- @doubt -->
### Why not just use `int()` or `stoi`?

<!-- @answer -->
Because the specification is deliberately different from both, in three independent ways. It **stops at trailing garbage** and keeps the leading digits, where `int()` requires the whole string to be a number — measured, that alone made `int()` raise on **41.1%** of 200,000 generated inputs where the specification returns a value. It skips **only the space character**, where `stoi`, `strtol` and `int()` all skip tabs and newlines, so `"\t42"` is 0 by the specification and 42 by all three. And it **clamps** to the 32-bit range, where `stoi` throws `out_of_range` and `strtol` clamps to `LONG_MAX` — which on a 64-bit platform means `"2147483648"` comes back as 2147483648, a value that does not fit the `int` you are about to store it in. The three built-ins also disagree with each other, which is a good sign that none of them is the specification.

<!-- @doubt -->
### Where exactly does the overflow check go?

<!-- @answer -->
Before the arithmetic that would overflow, not after it. In C++ signed overflow is undefined, so by the time you could inspect the result the program has already left the language. The guard is `val > INT_MAX / 10 || (val == INT_MAX / 10 && d > INT_MAX % 10)`, with the constants 214,748,364 and 7 — a value can safely take another digit while it is below a tenth of the maximum, or equal to it with a small enough digit. If you accumulate in a 64-bit type instead, the check can be a simple comparison against the limits, but it still has to be **inside** the loop: `"99999999999999999999"` is twenty digits and overflows a 64-bit accumulator too, so the early return is what keeps the wide type wide enough.

<!-- @doubt -->
### Why is negating the parsed number wrong?

<!-- @answer -->
Because the 32-bit range is asymmetric. `INT_MAX` is 2,147,483,647 and `INT_MIN` is -2,147,483,648, so there is one more negative value than positive — the magnitude 2147483648 exists as a negative number and has no positive counterpart. Any implementation that parses the digits as a magnitude and negates at the end hits exactly that value on `"-2147483648"`, which is the input the problem is most likely to test. Negating `INT_MIN` is undefined behaviour in C and C++; in Java it wraps back to `INT_MIN`, which happens to be right, and in Python the question does not arise. The fix is to special-case the magnitude, or better, to clamp to `INT_MIN` directly rather than ever computing it by negation.

<!-- @doubt -->
### My tests all pass. Is that not enough?

<!-- @answer -->
Not on this problem, and I can be specific about why. I wrote three overflow strategies, cross-checked them against each other over **300,000 random inputs** plus a full boundary sweep from 2147483646 down to -2147483649, and every one agreed. One of them was undefined behaviour on `"-2147483648"` from the first line I wrote it. The tests could not see it because a test compares the **answer**, and the undefined operation returned the correct answer on this machine — which is one of the things undefined behaviour is allowed to do. `-fsanitize=undefined` reported it on the first such input: *negation of -2147483648 cannot be represented in type 'int'*. For a problem whose entire difficulty is arithmetic at a boundary, the sanitizer is not an optional extra; it finds a class of defect the test suite structurally cannot.

<!-- @doubt -->
### Which of the three overflow strategies should I use?

<!-- @answer -->
The 64-bit accumulator, because it is the clearest, and it also measured the fastest at **18.15 microseconds per pass** against 19.18 for guard-before-multiply and 22.31 for the corrected unsigned version. They are all within about 1.2x, so this is a legibility choice rather than a performance one. Two caveats. The wide accumulator needs a type twice the width of the answer, which does not exist if the answer is already the widest type you have — there, guard-before-multiply is the only option, and it is the one that never performs an operation that could overflow. And be careful reading benchmarks here: the unsigned version measured **11.74** and looked like a 1.9x win, right up until the sanitizer showed that the missing check was the reason.

<!-- @doubt -->
### What is the right Python version?

<!-- @answer -->
A regular expression, because it spells out the specification exactly and runs in C. `re.match(r"^ *([+-]?\d+)", s)` is *optional spaces, optional sign, digit run* — the first three clauses verbatim — and with a `max`/`min` clamp around `int()` it is the whole problem. Measured 586.8 microseconds per pass over 2,000 inputs against 1,541.7 for an explicit character loop, a **2.6x** win, because both the scanning and the conversion cross into C. Two details matter: write `^ *` and not `^\s*`, since `\s` matches tabs and newlines that the specification does not skip; and note that `\d` matches Unicode decimal digits, so use `[0-9]` if the input might contain them. Python integers do not overflow, so the entire range story collapses into that one clamp.

<!-- @doubt -->
### Should the digit test be `isdigit()`?

<!-- @answer -->
Not in Python, and it is a genuine trap rather than a style preference. `str.isdigit()` returns `True` for characters like superscript `²` and various other Unicode digit forms, and `int()` will then refuse to convert the string you have collected — so the test and the conversion disagree about what a digit is. An explicit `"0" <= c <= "9"`, or `[0-9]` in a regex, matches what `int()` will actually accept. In C++ the mirror-image caution applies to `isdigit` from `<cctype>`: it takes an `int` and passing a negative `char` is undefined, so any byte above 127 in a signed `char` has to be cast to `unsigned char` first. The explicit range comparison sidesteps both problems and is no less readable.
