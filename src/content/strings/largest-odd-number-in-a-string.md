---
id: largest-odd-number-in-a-string
topic: Strings
title: Largest Odd Number in a String
difficulty: Easy
status: ready
prerequisites:
  - for-loop
  - if-else-statements
  - type-conversion-and-casting
  - largest-element
  - integer-overflow-and-precision-errors
  - time-and-space-complexity-basics
relatedIds:
  - longest-common-prefix
  - string-to-integer-atoi
  - reverse-every-word-in-a-string
  - largest-element
  - integer-overflow-and-precision-errors
---

<!-- @summary -->
Find the largest odd number that is a substring of a digit string — where the answer is always a prefix, verified with zero exceptions over 99,999 exhaustive inputs and 200,000 random ones, so the entire problem collapses to locating the last odd digit; and where the scan you would tune is not the cost, since the copy that returns the answer measured about 1,500x the scan it follows and the early exit that looks free is a 1.5x pessimisation on exactly the inputs that make you walk the whole string.

<!-- @theory -->
## The problem

Given a string `num` of decimal digits, return the largest **odd** number that
appears in it as a contiguous substring, as a string. Return the empty string if
there is none.

```
"35427"  ->  "35427"
"4206"   ->  ""
"52"     ->  "5"
"10"     ->  "1"
```

The input can be long — the standard constraint is up to 100,000 digits — and
that single fact rules out the first idea most people have. More on that below.

## Odd is decided by one character

A decimal number is odd exactly when its last digit is odd. Not its digit sum,
not its value, not anything you have to compute: the final character, tested
against `1 3 5 7 9`.

So every substring's parity is already visible without reading the substring. That
is the lever the whole problem turns on, and it is worth naming before anything
else, because it means the search space is not "all substrings" but "all end
positions".

## Pin down the specification first

Two readings of "largest" exist once leading zeros are possible, and they give
different **strings** for the same input:

```
num = "052"

candidates ending in an odd digit:   "05"  and  "5"
both have value 5
```

Measured over every digit string of length 1 to 4, there are **955 inputs where
the two tie-breaks disagree**, and every single one of them begins with `0` —
875 of the 10,000 length-4 strings. Their **values** never disagree: over all
11,110 inputs the value of the answer is identical under both readings, and the
shorter form is always the longer one with its leading zeros stripped.

The standard constraint says the input has no leading zeros, which makes the
question disappear. This container assumes that. State it anyway — it is the same
class of ambiguity as whether Pattern 9's widest row appears once or twice, and it
is invisible on every input that starts with a non-zero digit.

## The answer is always a prefix

This is the whole lesson. Let `i` be the **last** index at which `num[i]` is odd.
Then the answer is `num[0..i]`.

The argument is two lines. Take any substring `num[a..b]` that ends in an odd
digit. Then:

- `num[0..b]` ends in the same digit, so it is odd too — it is a legal candidate.
- `num[0..b]` is at least as long and (with no leading zeros) a longer decimal
  string is a larger number, so it is at least as large.

So for every candidate there is a **prefix** that is at least as good. Extending
the end as far right as possible is likewise never worse, which pins `b` to the
last odd position. Nothing else can win.

Verified rather than asserted: over all **99,999** digit strings of length 1 to 5
with no leading zero, brute force over every substring and the prefix rule agree
**every time**. Over **200,000** random strings of length up to 14, the same —
zero mismatches.

| Check | Inputs | Mismatches |
|---|---|---|
| Exhaustive, length 1-5, no leading zero | 99,999 | **0** |
| Random, length 1-14, no leading zero | 200,000 | **0** |
| Exhaustive, length 1-4, leading zeros allowed (by value) | 11,110 | **0** |

The problem is now: **find the last odd digit.** That is it.

## Do not turn it into a number

The instinct is to convert candidates with `stoll` or `Long.parseLong` and compare
integers. It fails, and not subtly:

| Digits | `std::stoll` |
|---|---|
| 18 | 999999999999999997 |
| **19** | **throws `std::out_of_range`** |
| 20 | throws `std::out_of_range` |
| 100,000 | throws `std::out_of_range` |

`LLONG_MAX` is 19 digits. The input allows 100,000. A 64-bit integer cannot hold
the answer and cannot hold most of the candidates, so any solution shaped around
`int` or `long long` is wrong on inputs the problem explicitly permits — it just
happens to pass the small examples.

Python's integers are arbitrary precision, so `int(s)` is *correct* there at any
length. It is still the wrong move, because it is O(digits) per comparison for a
question that never needed a comparison at all.

## The version that looks linear and is quadratic

Once you know the answer is a prefix, this looks like the natural way to write it:

```
best = ""
for i in 0..n-1:
    if num[i] is odd:
        best = num[0..i]     # <-- a copy, every time
```

One loop, no nesting. It is O(n^2). On random input about half the digits are
odd, so this makes roughly n/2 copies averaging n/2 characters each.

Measured, microseconds per run:

| n | Re-slicing prefix (C++) | One forward scan (C++) | Re-slicing (Python) | One scan (Python) |
|---|---|---|---|---|
| 1,000 | 19.38 | 0.36 | 60.91 | 29.73 |
| 10,000 | 513.66 | 3.30 | 939.17 | 316.17 |
| **100,000** | **38,011.88** | **31.64** | **41,392.66** | **3,189.29** |

**1,202x** in C++ at n = 100,000, from a loop that has no nested loop in it. The
nesting is hidden inside the assignment. Track the **index** and copy once at the
end and it is linear again — which is the same "track the index, not the value"
correction Selection Sort needed, for a different reason.

For scale, the honest brute force over every substring is far worse still:

| n | Every substring | Scan from the right | Ratio |
|---|---|---|---|
| 100 | 211.43us | 0.026us | 7,984x |
| 200 | 939.65us | 0.029us | 32,827x |
| 400 | 4,108.03us | 0.033us | 125,917x |
| 800 | 19,017.68us | 0.038us | **503,660x** |

## The early exit is not free

Scanning from the **right** and returning at the first odd digit is the natural
optimisation: on random input it stops after about two digits instead of reading
all 100,000.

It is a large win when it works, and a loss when it does not. Measured at
n = 100,000:

| Input | Forward scan | Right-to-left, early exit |
|---|---|---|
| Last digit odd | 31.78us | **1.91us** |
| Random | 33.11us | **1.84us** |
| Only the first digit odd | **30.18us** | 44.92us |
| No odd digit at all | **30.50us** | 46.10us |

On the inputs that force a full traversal the early-exit version is **1.5x
slower** than the version that never tried. Two things cause it, and separating
them matters:

- **Direction.** Isolated with index-returning loops over the same 100 KB buffer,
  forward scanning takes 30.2us and backward scanning 35.5us — **1.17x**,
  reproducible at 10^4, 10^5 and 10^6. A forward loop with no early exit can be
  unrolled and vectorised; a backward loop that may return on any byte cannot.
- **The rest** is the extra work of returning a `std::string` from the branchy loop.

So the early exit is right for the expected case and wrong for the adversarial
one, by about half again. That is a real trade rather than a free lunch, and it is
worth knowing which side of it you are on.

## Where the time actually goes

None of the above is the main cost. At n = 100,000 with the last digit odd:

| | Microseconds |
|---|---|
| Scan only, returning a `string_view` | **0.0013** |
| Scan plus `substr` into an owning `string` | **1.8725** |

**The copy is about 1,500x the scan** — median of five runs, which ranged from
1,327x to 1,751x. The spread is the memcpy, not the measurement: the scan side is
stable to a tenth of a nanosecond and the copy side is not. Every tuning decision in the previous two
sections moves a number that is under 2% of the total; the allocation and memcpy
that hand the answer back are the other 98%.

Which means the highest-value change is not in the loop at all. Return a
`string_view`, or return the length and let the caller slice — measured 0.0021us
against 1.643us on random input, **782x**, for a change to the signature rather
than to the algorithm.

## Python has a cliff here, one digit wide

CPython returns the *original object* when you slice a whole string:

```
s[:len(s)] is s     ->  True
s[:len(s)-1] is s   ->  False
```

So the answer is free exactly when it is the entire input, and a full copy when it
is one character shorter. Measured at n = 100,000:

| Slice | Microseconds |
|---|---|
| `num[:n]` — the whole string | **0.0454** |
| `num[:n-1]` — one character shorter | **2.4632** |
| `num[:n//2]` | 1.0448 |
| `num[:1]` | 0.0354 |

Run the same function on two inputs differing only in their last digit — one odd,
one even with an odd digit before it — and it takes **0.1792us** and **2.1807us**.
A 12x difference in runtime from a one-character difference in the input, with no
branch in your code that knows about it.

## A detail worth 1.42x

`(c - '0') % 2` and `(c - '0') & 1` are not the same instruction. The operand is a
signed `int`, and signed remainder has to get `-3 % 2 == -1` right, so the compiler
emits the correction. Measured on a full forward scan:

| n | `% 2` | `& 1` | Ratio |
|---|---|---|---|
| 10,000 | 4.483us | 3.166us | **1.42x** |
| 100,000 | 44.604us | 31.509us | **1.42x** |

Consistent at both sizes. `c % 2 == 1` also *silently fails* for negative values,
where the result is `-1` rather than `1` — not reachable from `'0'..'9'`, but the
habit is worth forming here rather than discovering later. In Python the readable
form `c in "13579"` avoids the question and the `int()` call together.

<!-- @intuition -->
The pull of this problem is toward searching, and there is nothing to search. Once you see that a number's parity is decided by its final character alone, the substrings stop being candidates to compare and become end positions to choose between — and once you see that extending a candidate leftward to the start and rightward to the last odd digit can only help, there is exactly one end position worth choosing. The answer was never found by comparison; it was determined by a position. The second half is a correction about where the cost of such a function lives. Three of this container's four approaches differ only in how they walk 100,000 bytes, and every one of those decisions is worth under 2% of the runtime, because the copy that returns the answer is 1,327 times the scan that finds it. The loop is the part you can see, so it is the part you tune. The allocation is in the return statement, so it does not look like work.

<!-- @approach -->
### Brute Force - Every Substring

<!-- @idea -->
Generate every substring, keep the ones ending in an odd digit, and return the largest by decimal comparison.

<!-- @steps -->
1. Hold a best-so-far string, initially empty.
2. Loop the start index from the first character to the last.
3. Loop the end index from the start index to the last character.
4. Skip this substring unless its final digit is one of 1, 3, 5, 7, 9.
5. Build the substring and compare it against the best so far as a decimal string — strip leading zeros, then longer wins, and equal lengths compare character by character.
6. Replace the best if this one is larger.
7. Return the best after both loops finish.

<!-- @complexity -->
- time: O(n^3) — n^2 substrings, each built and compared in O(n)
- space: O(n) for the candidate and the best-so-far
- note: Measured 19,017.68 microseconds at n = 800 against 0.038 for the scan, a factor of 503,660, and the gap widens with every size. At the problem's stated limit of 100,000 digits this does not finish. It is here to be discarded, but discarding it correctly is the point — the reason it loses is that it computes an ordering over every substring when the answer was determined by a single position.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

// Compare two decimal strings by value, ignoring leading zeros.
static bool greaterDecimal(const string& a, const string& b) {
    size_t ia = a.find_first_not_of('0'), ib = b.find_first_not_of('0');
    string x = ia == string::npos ? "0" : a.substr(ia);
    string y = ib == string::npos ? "0" : b.substr(ib);
    if (x.size() != y.size()) return x.size() > y.size();
    return x > y;
}

string largestOddNumber(const string& num) {
    string best;
    for (size_t i = 0; i < num.size(); i++) {
        for (size_t j = i; j < num.size(); j++) {
            if (((num[j] - '0') & 1) == 0) continue;
            string s = num.substr(i, j - i + 1);
            if (best.empty() || greaterDecimal(s, best)) best = s;
        }
    }
    return best;
}
```

<!-- @annotations -->
- 6: Substrings can begin with zeros even when the input does not, so a plain string comparison would rank "05" below "5". This is the bookkeeping the prefix rule deletes entirely.
- 17: Only the last character decides parity, which is already the hint that the inner loop is unnecessary.
- 18: One allocation per substring, n(n+1)/2 of them. This line is the algorithm's real cost.

<!-- @code java -->
```java
// Compare two decimal strings by value, ignoring leading zeros.
static boolean greaterDecimal(String a, String b) {
    String x = a.replaceFirst("^0+", ""), y = b.replaceFirst("^0+", "");
    if (x.length() != y.length()) return x.length() > y.length();
    return x.compareTo(y) > 0;
}

static String largestOddNumber(String num) {
    String best = "";
    for (int i = 0; i < num.length(); i++) {
        for (int j = i; j < num.length(); j++) {
            if ((num.charAt(j) - '0') % 2 == 0) continue;
            String s = num.substring(i, j + 1);
            if (best.isEmpty() || greaterDecimal(s, best)) best = s;
        }
    }
    return best;
}
```

<!-- @annotations -->
- 5: compareTo is lexicographic, so it is only correct once the lengths match. Comparing the raw strings would rank "9" above "35427", which is the single most common way to get this problem wrong.
- 13: substring copies in Java, so this allocates n(n+1)/2 strings and produces heavy garbage-collector pressure well before the time limit becomes the problem.

<!-- @code python -->
```python
def largest_odd_number(num):
    best = ""
    for i in range(len(num)):
        for j in range(i + 1, len(num) + 1):
            s = num[i:j]
            if s[-1] in "13579" and (best == "" or int(s) > int(best)):
                best = s
    return best


# int(s) is exact at any length in Python, so this is correct where the
# C++ and Java conversions would not be -- and measured 80,662.75us at
# n = 400 against 0.180us for the scan from the right.
```

<!-- @annotations -->
- 6: Python's arbitrary-precision ints make the comparison correct, but each one costs O(digits). Correct and unusable are not opposites.
- 11: The 448,192x gap at n = 400 is at a size 250 times smaller than the problem allows.

<!-- @approach -->
### Longest Prefix Ending in an Odd Digit

<!-- @idea -->
Use the prefix rule, but rebuild the prefix each time a new odd digit is found — the version that looks linear and is not.

<!-- @steps -->
1. Hold a best-so-far string, initially empty.
2. Walk the string from left to right.
3. Whenever the current digit is odd, replace the best with the prefix ending at this position.
4. Return the best when the walk ends.
5. Note what step 3 costs: it copies the prefix, so the work per odd digit grows with the position.

<!-- @complexity -->
- time: O(n^2) — one copy per odd digit, averaging n/2 characters on random input
- space: O(n) for the prefix being held
- note: The important approach in this container, because it is the one that gets written and shipped. There is no nested loop to see; the quadratic term lives inside the assignment on step 3. Measured 38,011.88 microseconds at n = 100,000 against 31.64 for the same algorithm with the copy moved outside the loop — 1,202x for a change that touches two lines.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

string largestOddNumber(const string& num) {
    string best;
    for (size_t i = 0; i < num.size(); i++) {
        if ((num[i] - '0') & 1) best = num.substr(0, i + 1);
    }
    return best;
}
```

<!-- @annotations -->
- 7: One allocation and one memcpy per odd digit. On random input that is about n/2 copies of about n/2 bytes, which is where the n^2 comes from — the loop above it is genuinely single.

<!-- @code java -->
```java
static String largestOddNumber(String num) {
    String best = "";
    for (int i = 0; i < num.length(); i++) {
        if ((num.charAt(i) - '0') % 2 == 1) best = num.substring(0, i + 1);
    }
    return best;
}
```

<!-- @annotations -->
- 4: Before Java 7 this shared the backing array and was O(1); since Java 7 substring copies, so the same code changed complexity class without changing a character.

<!-- @code python -->
```python
def largest_odd_number(num):
    best = ""
    for i, c in enumerate(num):
        if c in "13579":
            best = num[: i + 1]
    return best


# One slice per odd digit -- 41,392.66us at n = 100,000, against
# 3,189.29 for the same loop with the slice moved out of it.
```

<!-- @annotations -->
- 5: The slice is the quadratic term. Storing `last = i` instead and slicing once after the loop is a 13x improvement here and 1,202x in C++.

<!-- @approach -->
### One Forward Scan, One Copy

<!-- @idea -->
Record the index of the last odd digit during a single left-to-right pass, and build the answer once at the end.

<!-- @steps -->
1. Set the last-odd index to minus one, meaning none seen.
2. Walk the string from left to right, reading every character.
3. Whenever the digit is odd, overwrite the last-odd index with the current position.
4. After the walk, return the empty string if the index is still minus one.
5. Otherwise copy the prefix ending at that index and return it.

<!-- @complexity -->
- time: O(n) — exactly one pass, no early exit, one copy
- space: O(1) working, O(n) for the returned string
- note: Measured 31.64 microseconds at n = 100,000 and, unlike the version below, it costs the same on every input — 31.78 when the last digit is odd, 30.50 when there is no odd digit anywhere. It is also the faster of the two on the inputs that force a full traversal, by about 1.5x, because a loop with no early exit vectorises and a loop that may return on any byte does not.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

string largestOddNumber(const string& num) {
    int last = -1;
    for (int i = 0; i < (int)num.size(); i++) {
        if ((num[i] - '0') & 1) last = i;
    }
    return last < 0 ? string() : num.substr(0, last + 1);
}
```

<!-- @annotations -->
- 5: Minus one is the sentinel for "no odd digit", and it is what distinguishes "the answer is empty" from "the answer is the first character".
- 7: `& 1` rather than `% 2` — measured 1.42x faster at both 10,000 and 100,000 digits, because signed remainder has to handle negative operands.
- 9: The one copy. It is also 98% of this function's runtime, which the loop above gives no hint of.

<!-- @code java -->
```java
static String largestOddNumber(String num) {
    int last = -1;
    for (int i = 0; i < num.length(); i++) {
        if ((num.charAt(i) - '0') % 2 == 1) last = i;
    }
    return last < 0 ? "" : num.substring(0, last + 1);
}
```

<!-- @annotations -->
- 4: Writing `% 2 == 1` is safe here because the operand is 0 to 9, but it is false for negative values, where the result is -1. `& 1` is correct for both.
- 6: Return "" rather than null. A null answer forces every caller to guard, and the empty string is already the correct representation of "no odd substring exists".

<!-- @code python -->
```python
def largest_odd_number(num):
    last = -1
    for i, c in enumerate(num):
        if c in "13579":
            last = i
    return num[: last + 1] if last >= 0 else ""


# Correct and linear, but it reads every digit even when the last one is
# odd -- 3,189.29us at n = 100,000 against 1.880 for the scan from the
# right, which usually stops after two.
```

<!-- @annotations -->
- 4: Membership in a five-character literal, with no int() call. Both the conversion and the arithmetic disappear.
- 6: `last + 1` is 0 when last is -1, so `num[:0]` would already be "" — the explicit guard is for the reader, not the interpreter.

<!-- @approach -->
### Optimal - Scan From the Right, and Do Not Copy

<!-- @idea -->
Walk backwards and return at the first odd digit, and hand back a view or an index instead of an owning copy.

<!-- @steps -->
1. Walk the string from the last character towards the first.
2. Return as soon as a digit is odd — everything to its left is the answer.
3. Return the answer as a view or a length, not as a fresh string.
4. Return an empty view if the walk reaches the start without finding an odd digit.
5. Only copy if the caller genuinely needs to own the result.

<!-- @complexity -->
- time: O(n) worst case, O(1) best case — it stops at the first odd digit from the right
- space: O(1) — a view carries a pointer and a length, and copies nothing
- note: Measured 0.0021 microseconds at n = 100,000 on random input, against 1.643 for the same scan followed by a copy — 782x from changing the return type rather than the algorithm. The early exit itself is worth 1.84us against 33.11 on random input but costs 44.92 against 30.18 when only the first digit is odd, so it is a bet on the input rather than a strict improvement. The no-copy return is not a bet; it wins on every input.

<!-- @code cpp -->
```cpp
#include <string>
#include <string_view>
using namespace std;

// Returns a view into num -- no allocation, no copy, no ownership.
string_view largestOddNumber(const string& num) {
    for (int i = (int)num.size() - 1; i >= 0; i--) {
        if ((num[i] - '0') & 1) return string_view(num.data(), i + 1);
    }
    return string_view();
}

// The caller copies only if it must. Measured at n = 100,000 with the
// last digit odd: 0.0013us for the view, 1.8725us with the substr --
// the copy is about 1,500x the scan that found the answer.
```

<!-- @annotations -->
- 6: The view is valid only while `num` is. Returning one from a function that owns its string is a dangling reference — that is the price of the 782x, and it has to be paid deliberately.
- 8: The prefix always starts at index 0, so the view needs the data pointer and a length and nothing else.
- 13: This is the measurement that should decide the shape of the function. The loop is under 2% of it.

<!-- @code java -->
```java
static String largestOddNumber(String num) {
    for (int i = num.length() - 1; i >= 0; i--) {
        if ((num.charAt(i) - '0') % 2 == 1) return num.substring(0, i + 1);
    }
    return "";
}
```

<!-- @annotations -->
- 3: Java has no borrowed-slice type for String, so the copy is unavoidable here. Returning the index instead, and letting the caller decide, is the equivalent move.

<!-- @code python -->
```python
def largest_odd_number(num):
    for i in range(len(num) - 1, -1, -1):
        if num[i] in "13579":
            return num[: i + 1]
    return ""


# num[: len(num)] returns num itself in CPython, so the answer is free
# exactly when it is the whole input and a full copy when it is one
# character shorter: 0.1792us against 2.1807us on inputs that differ
# only in their last digit.
```

<!-- @annotations -->
- 2: `range(len(num) - 1, -1, -1)` stops at 0 inclusive. Writing `range(len(num) - 1, 0, -1)` silently never tests the first character, which is wrong for "10".
- 4: Free when i + 1 equals len(num), a 100 KB memcpy when it is one less. Return `i + 1` instead and the cliff disappears.

<!-- @example -->

<!-- @input -->
num = "35427"

<!-- @output -->
"35427"

<!-- @why -->
The last digit is already odd, so the answer is the entire input — the case that makes the prefix rule obvious and, in Python, the case that costs nothing.

<!-- @walkthrough -->
1. The digits are 3, 5, 4, 2, 7 at indices 0 through 4.
2. Scanning from the right, index 4 holds 7, which is odd, so the scan stops immediately.
3. The answer is the prefix ending at index 4, which is the whole string.
4. No other substring can beat it: any candidate is at most 5 digits, and this one is 5 digits and starts with the largest available leading digit.
5. The forward scan reaches the same index but reads all five digits to get there.
6. The brute force examines all 15 substrings and compares 8 of them, arriving at the same answer.
7. In Python `num[:5]` on a 5-character string returns the original object, so the answer costs nothing to produce.

<!-- @example -->

<!-- @input -->
num = "4206"

<!-- @output -->
"" (the empty string)

<!-- @why -->
No odd digit exists at all, which is the case that separates "answer is empty" from "answer is the first character" and the one every sentinel choice has to get right.

<!-- @walkthrough -->
1. The digits are 4, 2, 0, 6 — every one of them even.
2. The scan from the right tests index 3, then 2, then 1, then 0, and none is odd.
3. It falls out of the loop and returns the empty string.
4. The last-odd index in the forward version is still -1 here, which is exactly what it is for.
5. Returning `num[0..last]` without checking the sentinel would return `num[0..-1]` — an empty string in Python by accident, and undefined behaviour or an exception elsewhere.
6. This is also the early exit's worst case: it walks the entire input and returns nothing.
7. At n = 100,000 with no odd digit, the backward scan measured 46.10us against 30.50 for the forward one — the exit that never fires costs 1.5x.

<!-- @example -->

<!-- @input -->
Two 100,000-digit inputs differing only in the final character

<!-- @output -->
0.1792us and 2.1807us from the same Python function

<!-- @why -->
Shows that the cost of this function is set by the answer's length rather than by the input's, and that the boundary is one character wide.

<!-- @walkthrough -->
1. Both inputs are 100,000 digits and identical except at the last position.
2. In the first, the last digit is odd, so the answer is the whole string.
3. `num[:100000]` on a 100,000-character string returns the same object — `s[:len(s)] is s` is True in CPython.
4. So the answer is produced without copying anything, and the call takes 0.1792us.
5. In the second, the last digit is even and the one before it is odd, so the answer is 99,999 characters.
6. That slice is a genuinely new string, and copying it takes 2.4632us on its own.
7. The call takes 2.1807us — 12x the first — with no branch in the code that distinguishes the two cases.

<!-- @example -->

<!-- @input -->
num = "052", against the same input with the leading zero removed

<!-- @output -->
"05" or "5" depending on the tie-break; both have value 5

<!-- @why -->
A specification ambiguity rather than a bug, and one that no input beginning with a non-zero digit can reveal.

<!-- @walkthrough -->
1. The only odd digit is 5, at index 1.
2. The prefix rule gives `num[0..1]`, which is "05".
3. The substring "5" is also a valid odd candidate and has the same value.
4. So the two are tied on value and differ only as strings, and which one is "largest" depends on a rule the statement has to supply.
5. Measured over all digit strings of length 1 to 4, 955 inputs have this disagreement, and every one of them begins with 0.
6. At length 4 that is 875 of the 10,000 possible strings.
7. Their values never disagree — over all 11,110 inputs the answer's value is identical under both readings, and the shorter form is the longer one with the leading zeros stripped.
8. The standard constraint forbids leading zeros in the input, which removes the question; this container assumes that and says so.

<!-- @visualization pointer-scan -->

<!-- @description -->
Open on the digit string as a row of cells with the odd digits tinted and the even ones flat, so the only structure that matters is visible before anything moves. Sweep a bracket over every substring the brute force would build, letting each one flash and drop away, and keep a counter of allocations climbing to n(n+1)/2 — then freeze and collapse all of them onto the single prefix that wins, with the discarded candidates fading in place rather than vanishing, so the ratio between what was computed and what was needed stays on screen. Next, prove the prefix rule visually: pick any highlighted candidate mid-string, then extend its left edge to index 0 and its right edge to the last tinted cell, annotating each extension with why it cannot hurt — same final digit, so still odd; more digits, so not smaller. Put the verification counts beside it as two settled chips reading 99,999 exhaustive and 200,000 random, both with 0 mismatches. The centre of the figure is the cost model, and it should contradict what the code looks like. Run two pointers over the same row — one forward with no exit, one backward stopping at the first tinted cell — and show the backward one finishing in two steps on random input and in 100,000 on an all-even one, with a small bar pair reading 1.84us against 33.11 in the first case and 44.92 against 30.18 in the second, so the early exit is visibly a bet rather than an improvement. Then, beneath both, draw the return statement as a block whose area is the copy: 0.0013us for the scan as a hairline, 1.8725us for the copy as a slab about 1,500 times its area, filling most of the frame. Keep that proportion honest, because the whole point is that the loop the eye follows is under 2% of the work. Close on the Python cliff: two identical 100,000-cell rows differing only in the final cell, one returning an arrow that loops back to the original row labelled same object, 0.1792us, the other returning a freshly drawn row labelled new string, 2.1807us.

<!-- @sampleInput -->
```json
{"primary":{"num":"35427","answer":"35427","lastOddIndex":4,"rule":"answer = num[0..i] where i is the last index with an odd digit"},"smallCases":[{"num":"35427","answer":"35427","lastOddIndex":4},{"num":"4206","answer":"","lastOddIndex":-1},{"num":"52","answer":"5","lastOddIndex":0},{"num":"10","answer":"1","lastOddIndex":0}],"parity":{"decidedBy":"the final character only","oddDigits":"13579","searchSpace":"end positions, not substrings"},"lemma":{"claim":"the answer is always a prefix of num","argument":["num[0..b] ends in the same digit as num[a..b], so it is odd too","num[0..b] is at least as long, and with no leading zeros a longer decimal string is larger","so extending left to index 0 never hurts, and extending right to the last odd digit never hurts"],"verification":[{"kind":"exhaustive, length 1-5, no leading zero","inputs":99999,"mismatches":0},{"kind":"random, length 1-14, no leading zero","inputs":200000,"mismatches":0},{"kind":"exhaustive, length 1-4, leading zeros allowed, compared by value","inputs":11110,"mismatches":0}]},"specAmbiguity":{"input":"052","candidates":["05","5"],"bothHaveValue":5,"disagreeingInputsLength1to4":955,"allBeginWithZero":true,"atLength4":"875 of 10000","valuesEverDisagree":false,"shorterFormIs":"the longer one with leading zeros stripped","standardConstraint":"no leading zeros in the input, which removes the question"},"integerConversion":{"llongMaxDigits":19,"stoll":[{"digits":18,"result":"999999999999999997"},{"digits":19,"result":"throws std::out_of_range"},{"digits":20,"result":"throws std::out_of_range"},{"digits":100000,"result":"throws std::out_of_range"}],"inputLimit":100000,"reading":"any solution shaped around long long is wrong on inputs the problem permits; Python's int is exact but O(digits) per comparison for a comparison never needed"},"approaches":{"everySubstring":{"time":"O(n^3)","space":"O(n)"},"reslicingPrefix":{"time":"O(n^2)","space":"O(n)","trap":"single loop, quadratic — the copy is inside the assignment"},"forwardScan":{"time":"O(n)","space":"O(1) working"},"scanFromRight":{"time":"O(n) worst, O(1) best","space":"O(1) with a view"}},"benchCpp":{"unit":"microseconds per run, Apple M2, clang -O2","everySubstringVsScan":[{"n":100,"brute":211.43,"scanRight":0.026,"ratio":"7984x"},{"n":200,"brute":939.65,"scanRight":0.029,"ratio":"32827x"},{"n":400,"brute":4108.03,"scanRight":0.033,"ratio":"125917x"},{"n":800,"brute":19017.68,"scanRight":0.038,"ratio":"503660x"}],"linearShapesRandomInput":[{"n":1000,"reslicingPrefix":19.382,"forwardScan":0.361,"scanRight":0.039,"viewNoCopy":0.0012},{"n":10000,"reslicingPrefix":513.663,"forwardScan":3.295,"scanRight":0.181,"viewNoCopy":0.0021},{"n":100000,"reslicingPrefix":38011.877,"forwardScan":31.639,"scanRight":1.643,"viewNoCopy":0.0021}],"bestAndWorstCaseAtN100000":[{"input":"last digit odd","forwardScan":31.778,"scanRight":1.91,"viewNoCopy":0.0012},{"input":"random","forwardScan":33.114,"scanRight":1.843,"viewNoCopy":0.0021},{"input":"only the first digit odd","forwardScan":30.182,"scanRight":44.919,"viewNoCopy":45.4256},{"input":"no odd digit at all","forwardScan":30.502,"scanRight":46.104,"viewNoCopy":46.3232}],"whereTheTimeGoes":{"n":100000,"scanOnlyView":0.0013,"scanPlusCopy":1.8725,"copyIsRatio":"about 1500x the scan","runs":[1327,1422,1496,1620,1751],"median":1496,"copyShareOfRuntime":"about 98%","note":"the spread is the memcpy, not the measurement — the scan side is stable across runs"},"scanDirectionIsolated":{"buffer":"100 KB, all even, index-returning loops","forward":30.2,"backward":35.5,"ratio":"1.17x","reproducibleAt":[10000,100000,1000000],"reason":"a forward loop with no early exit unrolls and vectorises; a backward loop that may return on any byte cannot"},"modVsAnd":[{"n":10000,"mod2":4.483,"and1":3.166,"ratio":"1.42x"},{"n":100000,"mod2":44.604,"and1":31.509,"ratio":"1.42x"}],"methodology":"single-threaded, otherwise idle machine; the copy-side figure is the median of five runs and is quoted as approximate because it varies about 30% run to run"},"benchPython":{"unit":"microseconds per run, CPython 3.13.4","everySubstringVsScan":[{"n":50,"brute":178.99,"scanRight":0.146,"ratio":"1229x"},{"n":100,"brute":958.6,"scanRight":0.144,"ratio":"6670x"},{"n":200,"brute":5949.11,"scanRight":0.195,"ratio":"30445x"},{"n":400,"brute":80662.75,"scanRight":0.18,"ratio":"448192x"}],"linearShapesRandomInput":[{"n":1000,"reslicingPrefix":60.91,"forwardScan":29.73,"scanRight":0.181,"indexOnly":0.1597},{"n":10000,"reslicingPrefix":939.17,"forwardScan":316.17,"scanRight":0.403,"indexOnly":0.1836},{"n":100000,"reslicingPrefix":41392.66,"forwardScan":3189.29,"scanRight":1.88,"indexOnly":0.1833}],"bestAndWorstCaseAtN100000":[{"input":"last digit odd","forwardScan":3180.99,"scanRight":0.19},{"input":"random","forwardScan":3182.86,"scanRight":1.81},{"input":"only the first digit odd","forwardScan":2408.65,"scanRight":2240.65},{"input":"no odd digit at all","forwardScan":2382.15,"scanRight":2092.1}],"sliceCliff":{"identity":"s[:len(s)] is s -> True; s[:len(s)-1] is s -> False","atN100000":[{"slice":"num[:n]","us":0.0454},{"slice":"num[:n-1]","us":2.4632},{"slice":"num[:n//2]","us":1.0448},{"slice":"num[:1]","us":0.0354}],"sameFunctionTwoInputs":{"lastDigitOdd":0.1792,"lastDigitEven":2.1807,"ratio":"12x","differBy":"one character"}},"backwardScanNotSlower":"unlike C++, the backward loop is not penalised here — 2092.10 against 2382.15 on all-even input"},"assertions":["the answer is a prefix of num or the empty string","the answer's last character is one of 1 3 5 7 9, or the answer is empty","no index after the answer's end holds an odd digit","the answer is empty exactly when num contains no odd digit","the answer is never longer than num"],"lesson":"the search collapses to a single position, and the cost collapses to the return statement rather than the loop"}
```

<!-- @highlights -->
- The digit string appears as a row of cells with the odd digits tinted and the even ones flat.
- A bracket sweeps every substring the brute force would build, each flashing and dropping away.
- An allocation counter climbs to n(n+1)/2 as it goes.
- The sweep freezes and every candidate collapses onto the single winning prefix, the discards fading in place.
- A candidate is picked mid-string, then its left edge extends to index 0 and its right edge to the last tinted cell.
- Each extension is annotated: same final digit so still odd, more digits so not smaller.
- Two settled chips read 99,999 exhaustive and 200,000 random, both with 0 mismatches.
- Two pointers then run the same row — one forward with no exit, one backward stopping at the first tinted cell.
- On random input the backward pointer finishes in two steps; on an all-even row it takes 100,000.
- A bar pair reads 1.84us against 33.11 in the first case and 44.92 against 30.18 in the second.
- The early exit is drawn as a bet on the input, not as an improvement.
- Beneath both, the return statement is drawn as a block whose area is the copy.
- The scan is a hairline at 0.0013us; the copy is a slab about 1,500 times its area at 1.8725us, filling most of the frame.
- That proportion is kept honest — the loop the eye follows is under 2% of the work.
- The close is the Python cliff: two identical 100,000-cell rows differing only in the final cell.
- One returns an arrow looping back to the original row, labelled same object, 0.1792us.
- The other returns a freshly drawn row, labelled new string, 2.1807us.

<!-- @edgeCases -->
- A single odd digit, such as "7" — the answer is the whole input, and the smallest case where the prefix rule is visible.
- A single even digit, such as "8" — the answer is the empty string, and the smallest case that needs the sentinel.
- No odd digit anywhere, such as "4206" — the answer is empty, and this is the early exit's worst case, measured 46.10us against 30.50 at n = 100,000.
- Only the first digit odd, such as "3222" — the answer is one character, and the backward scan walks the entire input to find it.
- The last digit odd — the answer is the whole input, the early exit stops after one step, and in Python the slice costs nothing because it returns the original object.
- The last digit even with an odd digit immediately before it — one character shorter, and in Python 12x slower for that one character.
- Interior zeros, such as "1005" — harmless; only leading zeros in a candidate raise the comparison question, and the prefix rule sidesteps it.
- A leading zero in the input, such as "052" — outside the standard constraint, and the one case where "largest" needs a tie-break rule stated.
- 100,000 digits — the stated limit, where the brute force does not finish and any long long conversion throws.
- Exactly 19 digits — the first length at which `std::stoll` throws `std::out_of_range`, and the boundary that makes integer conversion unusable.

<!-- @pitfalls -->
- Converting candidates to integers. `LLONG_MAX` is 19 digits and the input allows 100,000, so `stoll` throws from 19 digits on — the approach passes every small example and is wrong on inputs the problem explicitly permits.
- Comparing decimal strings with `compareTo` or `<`. That is lexicographic, so "9" ranks above "35427" and the answer is a single digit on most inputs.
- Rebuilding the prefix inside the loop. One copy per odd digit makes a single-loop function quadratic — measured 38,011.88us against 31.64 at n = 100,000, a 1,202x penalty with no nested loop in sight.
- Assuming the early exit is a strict improvement. It is 18x faster on random input and 1.5x slower when no odd digit exists, so it is a bet on the input distribution.
- Tuning the scan and ignoring the return. The copy measured about 1,500x the scan it follows; every loop-level decision moves under 2% of the runtime.
- Writing `(c - '0') % 2` instead of `& 1`. Measured 1.42x slower at both 10,000 and 100,000 digits, and `% 2 == 1` is also false for negative operands, where the result is -1.
- Returning `num[0..last]` without checking the sentinel. When no odd digit was found, `last` is -1 and the expression is either an accidental empty string or undefined behaviour, depending on the language.
- Writing `range(len(num) - 1, 0, -1)` in Python. It never tests index 0, so "10" returns "" instead of "1".
- Returning `null` instead of the empty string. Every caller then needs a guard for a case the empty string already represents correctly.
- Returning a `string_view` from a function that owns its buffer. The 782x is real, but the view is valid only while the original string is, so the lifetime has to be the caller's.
- Assuming the leading-zero question cannot arise. It affects 875 of the 10,000 length-4 strings — all of them starting with 0 — and is invisible on every input the standard constraint allows.

<!-- @doubt -->
### Why is the answer always a prefix? It feels like some substring in the middle could win.

<!-- @answer -->
It cannot, and the argument is two steps. Take any substring `num[a..b]` that ends in an odd digit. First, extend its left edge to index 0: `num[0..b]` ends in the same digit, so it is still odd, and it has more digits, so with no leading zeros it is a larger number. Second, extend its right edge to the last odd position: same reasoning. So every candidate is dominated by a prefix, and only one prefix survives both extensions — the one ending at the last odd digit. This is verified rather than argued: over all 99,999 digit strings of length 1 to 5 with no leading zero, and over 200,000 random strings of length up to 14, brute force over every substring and the prefix rule agree with zero exceptions.

<!-- @doubt -->
### Can I not just convert the substrings to numbers and compare?

<!-- @answer -->
Not in C++ or Java. `LLONG_MAX` is 19 digits and the input allows 100,000, so `std::stoll` returns a value at 18 digits and throws `std::out_of_range` from 19 onward. A solution built on `long long` passes "35427" and "4206" and is wrong on inputs the constraints explicitly permit, which is the worst failure mode there is — it looks correct. Python's integers are arbitrary precision so `int(s)` is genuinely correct at any length, but it costs O(digits) per comparison for a question that never needed a comparison: parity is decided by one character, and the winner is decided by a position.

<!-- @doubt -->
### My solution has one loop and no nesting. Why is it O(n^2)?

<!-- @answer -->
Because the copy is inside it. Writing `best = num[0..i]` every time you hit an odd digit allocates and copies a prefix, and that prefix grows with `i`. On random input about half the digits are odd, so you make roughly n/2 copies averaging n/2 characters — quadratic, with nothing nested to see. Measured at n = 100,000: 38,011.88us for that version against 31.64us for the same algorithm with `last = i` in the loop and one copy after it, a factor of 1,202. The fix is to track the index and materialise once, which is the same correction Selection Sort needs for a different reason.

<!-- @doubt -->
### Should I scan from the left or from the right?

<!-- @answer -->
From the right if you expect ordinary inputs, from the left if you are worried about adversarial ones, and it matters less than you would think either way. Measured at n = 100,000: on random input the backward scan with an early exit takes 1.84us against 33.11 for the forward scan, because it usually stops after about two digits. On input with no odd digit at all it takes 46.10us against 30.50 — the exit never fires and you paid 1.5x for the attempt. Isolated, backward traversal alone costs 1.17x per byte, reproducibly, because a forward loop with no early exit can be unrolled and vectorised while a loop that may return on any byte cannot. The rest of the gap is the branchy return.

<!-- @doubt -->
### If the loop is only 2% of the runtime, what is the other 98%?

<!-- @answer -->
The copy that returns the answer. At n = 100,000 with the last digit odd, the scan returning a `string_view` measured 0.0013us and the same scan followed by `substr` measured 1.8725us — the copy is about 1,500 times the scan, median of five runs spanning 1,327x to 1,751x. So the highest-value change is to the signature rather than the algorithm: return a view, or return the length and let the caller slice, and the function measures 0.0021us against 1.643us on random input. That is 782x for a change that touches no logic. The catch is lifetime — a `string_view` is valid only while the original string is, so this is a deliberate trade rather than a free one.

<!-- @doubt -->
### Why does my Python solution take 12x longer on an input that changed by one character?

<!-- @answer -->
Because CPython returns the original object when you slice an entire string: `s[:len(s)] is s` is True, while `s[:len(s)-1] is s` is False. When the last digit is odd the answer is the whole input and the slice is free; when the last digit is even and the one before it is odd the answer is one character shorter and the slice is a real 100 KB copy. Measured on two 100,000-digit inputs differing only in their final character: 0.1792us and 2.1807us. Nothing in your code branches on this. Return `i + 1` instead of `num[:i + 1]` and the cliff disappears entirely — the index-only version measured 0.1833us regardless of the input.

<!-- @doubt -->
### Does it matter whether I write `% 2` or `& 1`?

<!-- @answer -->
Measurably, yes. `(c - '0') % 2` operates on a signed `int`, and signed remainder has to produce `-3 % 2 == -1`, so the compiler emits the sign correction. On a full forward scan that measured 4.483us against 3.166us at 10,000 digits and 44.604us against 31.509us at 100,000 — 1.42x at both sizes. There is also a correctness edge: `c % 2 == 1` is false for negative values, where the result is `-1`, so the idiom breaks the moment it meets a signed type that can go negative. Digits from `'0'` to `'9'` never can, which is precisely why this is the right place to form the habit. In Python, `c in "13579"` skips both the conversion and the arithmetic.

<!-- @doubt -->
### What should I return when there is no odd digit?

<!-- @answer -->
The empty string, not `null` and not a sentinel value. The empty string already means "no odd substring exists" and needs no guard at the call site, whereas `null` forces every caller to write one. The implementation detail that goes with it is the `last = -1` initial value in the forward scan: it is what distinguishes "no odd digit anywhere" from "the odd digit is at index 0", and skipping the `last < 0` check makes those two cases collide. In Python `num[:0]` happens to be `""` so the bug hides; in C++ `num.substr(0, 0)` is fine but `num[0..last]` written as a range is not.
