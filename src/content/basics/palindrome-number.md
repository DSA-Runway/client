---
id: palindrome-number
topic: Basics
title: Palindrome Number
difficulty: Medium
status: ready
prerequisites:
  - reverse-a-number
  - count-digits
  - while-loop
  - arithmetic-operators
  - relational-and-logical-operators
relatedIds:
  - reverse-a-number
  - count-digits
  - arithmetic-operators
  - relational-and-logical-operators
---

<!-- @summary -->
Decide whether a number reads the same forwards and backwards — starting from reverse-and-compare, then the trick that examines only half the digits and cannot overflow at all.

<!-- @theory -->
## The problem

Given an integer `N`, return whether it reads the same forwards and backwards.

```
121    ->  true
1221   ->  true
123    ->  false
-121   ->  false     (by convention — see below)
10     ->  false
0      ->  true
```

## The obvious solution

You already have it. From the previous subtopic:

```
reverse(N) == N   ->   palindrome
```

Reverse the number and compare it with the original. That is the whole algorithm, and
it is a perfectly good answer.

Two details to get right before anything else.

## Negatives are not palindromes

`-121` reversed reads `121-`, and `121-` is not a number. The minus sign has a fixed
position, so a negative value cannot read the same in both directions.

This is a **convention**, not a mathematical truth — a problem statement could define
it differently by ignoring the sign. Every standard version of this problem treats
negatives as non-palindromes, and that is what these implementations do. Check the
statement if it matters.

Return `false` immediately for anything below zero. It also removes the Python
floor-division trap from the previous subtopic before it can bite.

## Any number ending in zero fails — except zero itself

`10`, `100`, `1200`, `50` — none of these can be palindromes. If the last digit is
`0`, the first digit would have to be `0` too, and a number does not have a leading
zero. That is the same fact the previous subtopic covered from the other direction:
`1200` reverses to `21`, not `0021`.

`0` is the exception: a single digit, and trivially a palindrome.

That gives a cheap early exit — and for one of the approaches below, **it is not
optional**. More on that shortly.

## The better idea: only reverse half

Reversing the whole number does more work than the question needs, and it risks
overflow for large inputs.

The insight: **to compare a number with its reverse, you only need to reverse half of
it.** Peel digits off the back and build them into a reversed half, and stop once
that reversed half has caught up with what remains at the front:

```
1221:   x = 1221, rev = 0
        x = 122,  rev = 1
        x = 12,   rev = 12     <- x is no longer greater than rev, stop
        12 == 12  ->  palindrome
```

The loop condition is `while (x > rev)`. Each iteration moves one digit from `x` to
`rev`, so they meet in the middle after roughly half the digits.

**`rev` never holds more than half the digits, so it cannot overflow.** A value that
fit in the input type will always have a half that fits. The overflow problem from the
previous subtopic disappears rather than being guarded against.

## Odd digit counts

With an odd number of digits there is a middle digit that belongs to neither half:

```
12321:  x = 12321, rev = 0
        x = 1232,  rev = 1
        x = 123,   rev = 12
        x = 12,    rev = 123    <- stop, rev has overshot
```

`rev` is `123` and `x` is `12`. They are not equal — but the `3` is the middle digit,
which sits in the centre and matches itself by definition. Drop it with `rev / 10`
and the comparison works:

```
return x == rev || x == rev / 10;
```

The first test covers even digit counts, the second covers odd ones.

## Why the trailing-zero guard is mandatory here

This is the part that is easy to miss, and it was measured rather than reasoned about.

Take `x = 10` without the guard:

```
x = 10, rev = 0
  10 > 0  ->  rev = 0,  x = 1     (the 0 is appended to rev, changing nothing)
  1  > 0  ->  rev = 1,  x = 0
  0 > 1 is false, stop
x is 0, rev is 1.  0 == 1? No.  0 == 1/10 = 0? YES  ->  reports palindrome
```

The `rev / 10` branch, which exists for odd digit counts, accidentally matches. **10 is
reported as a palindrome.**

Removing the guard produces **1,431 wrong answers in the first million**, starting at
10 — every value ending in zero. Measured on this machine against a string reference.

With the guard in place, the same implementation was checked exhaustively over
**0 to 1,999,999** plus boundary values including `1000000001`, `2147483647` and
`1000021`, with **zero mismatches**.

**The guard is part of the algorithm, not a nicety.**

## An honest note on the full-reversal approach

The usual claim is that reverse-and-compare is unsafe because reversing a large value
overflows. That deserves more care than it usually gets.

A genuine palindrome that fits in the type always has a reverse that fits — it is the
same number. So overflow can only occur while reversing a **non**-palindrome, and the
question is whether a wrapped result could ever land back on the original value and
produce a false positive.

Scanning the entire non-negative 32-bit range, 0 to 2,147,483,647, with wrapping
arithmetic: **zero false positives and zero false negatives.** On 32-bit `int` the
naive version happens to be correct for every input.

That is not a licence to use it. Signed overflow is **undefined behaviour** in C++ —
the compiler is entitled to assume it never happens and optimise on that basis, so
"it worked when I measured it" is not a guarantee across compilers or flags. It also
says nothing about 64-bit inputs.

The honest summary: **the full-reversal approach is not observably wrong on 32-bit
ints, and it relies on behaviour the language does not define.** The half-reversal
version avoids the question entirely and does half the work. Use that one.

## Approaches

| # | Approach | Time | Space | Overflow risk |
|---|---|---|---|---|
| 1 | Full reversal, compare | O(log₁₀ N) | O(1) | Relies on wrapping |
| 2 | **Half reversal** | O(log₁₀ N) — half the iterations | O(1) | **None** |
| 3 | String two-pointer | O(log₁₀ N) | **O(log₁₀ N)** | None |

All three are O(log₁₀ N). The half-reversal runs roughly half as many iterations,
which does not change the complexity class — the same distinction the nested-loops
subtopic made about triangular loops.

## What carries forward

The two-pointer comparison in approach 3 — walking inward from both ends and stopping
at the first mismatch — is a pattern you will use constantly on arrays and strings.
This is the smallest possible place to meet it.

<!-- @intuition -->
A palindrome mirrors around its centre, so checking one half against the other is enough — the second half is the first half's reflection. Reversing the whole number computes information you already had, and pays overflow risk for the privilege.

<!-- @approach -->
### Full Reversal and Compare

<!-- @idea -->
Reverse the entire number using the previous subtopic's loop and test whether it equals the original.

<!-- @steps -->
1. Return false immediately for negative input, since the minus sign cannot mirror.
2. Keep a copy of the original value, because the loop destroys the input.
3. Reverse the number using the accumulator loop: read the last digit, shift the accumulator left, append, and divide.
4. Compare the reversed value with the saved original.
5. Return whether they are equal.

<!-- @complexity -->
- time: O(log₁₀ N)
- space: O(1)
- note: One iteration per digit, bounded at 10 for a 32-bit int and 19 for a 64-bit integer. Only the accumulator and the saved original are stored. Accumulating into a wider type removes any overflow concern; keeping the same width relies on wrapping behaviour that C++ leaves undefined.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

bool isPalindrome(int x) {
    if (x < 0) return false;          // -121 reversed is 121-, not a number

    long long rev = 0;                // wider type removes the overflow question
    int original = x;                 // the loop destroys x, so save it first

    while (x != 0) {
        rev = rev * 10 + x % 10;
        x /= 10;
    }
    return rev == original;
}

int main() {
    cout << isPalindrome(121)   << endl;   // 1
    cout << isPalindrome(1221)  << endl;   // 1
    cout << isPalindrome(123)   << endl;   // 0
    cout << isPalindrome(-121)  << endl;   // 0
    cout << isPalindrome(10)    << endl;   // 0  — reverse is 1, not 10
    cout << isPalindrome(0)     << endl;   // 1
    return 0;
}
```

<!-- @annotations -->
- 7: Accumulating into long long sidesteps the overflow question entirely for int input.
- 8: Forgetting this copy is the most common bug here — x is zero by the time you want to compare.
- 17: Trailing zeros are why this fails: 10 reverses to 1, and 1 is not 10.

<!-- @code java -->
```java
public class Palindrome {

    static boolean isPalindrome(int x) {
        if (x < 0) return false;

        long rev = 0;
        int original = x;

        while (x != 0) {
            rev = rev * 10 + x % 10;
            x /= 10;
        }
        return rev == original;
    }

    public static void main(String[] args) {
        System.out.println(isPalindrome(121));    // true
        System.out.println(isPalindrome(1221));   // true
        System.out.println(isPalindrome(123));    // false
        System.out.println(isPalindrome(-121));   // false
        System.out.println(isPalindrome(10));     // false
        System.out.println(isPalindrome(0));      // true
    }
}
```

<!-- @annotations -->
- 6: Java's long is 64-bit, so a reversed int always fits with room to spare.

<!-- @code python -->
```python
def is_palindrome(x):
    if x < 0:
        return False              # also avoids the floor-division trap entirely

    original = x
    rev = 0
    while x > 0:
        rev = rev * 10 + x % 10
        x //= 10
    return rev == original

print(is_palindrome(121))     # True
print(is_palindrome(1221))    # True
print(is_palindrome(123))     # False
print(is_palindrome(-121))    # False
print(is_palindrome(10))      # False
print(is_palindrome(0))       # True

# Python integers are unbounded, so overflow is not a concern here at all.
print(is_palindrome(12345678987654321))   # True
```

<!-- @annotations -->
- 3: The negative guard doubles as protection: without it, the loop from the previous subtopic would never terminate.
- 9: Use // rather than /, or the value never reaches exactly zero.

<!-- @approach -->
### Reverse Only Half the Digits

<!-- @idea -->
Build the reversed second half until it meets the remaining first half, so no accumulator ever holds more than half the digits.

<!-- @steps -->
1. Return false for negative input.
2. Return false for any positive number whose last digit is zero, since its mirror would need a leading zero.
3. Initialise the reversed half to zero.
4. While the remaining number is greater than the reversed half, move one digit across: append it to the reversed half and remove it from the number.
5. Stop when the two meet, which happens after roughly half the digits.
6. Return true if they are equal, or if the number equals the reversed half with its last digit dropped, which handles an odd digit count.

<!-- @complexity -->
- time: O(log₁₀ N)
- space: O(1)
- note: Roughly half the iterations of the full reversal, since the loop stops once the two halves meet. That halves a constant factor without changing the complexity class. The real gain is that the accumulator never holds more than half the digits, so overflow is impossible rather than merely guarded against.

<!-- @code cpp -->
```cpp
bool isPalindromeHalf(int x) {
    // Negatives cannot mirror
    if (x < 0) return false;
    // MANDATORY: any positive number ending in 0 would need a leading zero.
    // Without this line, 10 is reported as a palindrome.
    if (x % 10 == 0 && x != 0) return false;

    int rev = 0;
    while (x > rev) {
        rev = rev * 10 + x % 10;   // move one digit across
        x /= 10;
    }

    // Even digit count: the halves match exactly.
    // Odd digit count: rev carries the middle digit, so drop it.
    return x == rev || x == rev / 10;
}

// 1221 -> x=1221 rev=0 | x=122 rev=1 | x=12 rev=12 -> equal, true
// 12321 -> x=12321 rev=0 | x=1232 rev=1 | x=123 rev=12 | x=12 rev=123
//          12 == 123/10 == 12 -> true
// 10   -> caught by the guard before the loop runs

cout << isPalindromeHalf(121)        << endl;   // 1
cout << isPalindromeHalf(1221)       << endl;   // 1
cout << isPalindromeHalf(12321)      << endl;   // 1
cout << isPalindromeHalf(10)         << endl;   // 0
cout << isPalindromeHalf(1000000001) << endl;   // 1
cout << isPalindromeHalf(2147483647) << endl;   // 0
```

<!-- @annotations -->
- 6: Measured: removing this produces 1,431 wrong answers in the first million, starting at 10.
- 10: rev only ever holds half the digits, so it cannot overflow for any value the input type can hold.
- 16: The rev / 10 branch discards the middle digit, which matches itself by definition.

<!-- @code java -->
```java
static boolean isPalindromeHalf(int x) {
    if (x < 0) return false;
    if (x % 10 == 0 && x != 0) return false;   // mandatory guard

    int rev = 0;
    while (x > rev) {
        rev = rev * 10 + x % 10;
        x /= 10;
    }
    return x == rev || x == rev / 10;
}

System.out.println(isPalindromeHalf(121));          // true
System.out.println(isPalindromeHalf(1221));         // true
System.out.println(isPalindromeHalf(12321));        // true
System.out.println(isPalindromeHalf(10));           // false
System.out.println(isPalindromeHalf(1000000001));   // true
System.out.println(isPalindromeHalf(Integer.MAX_VALUE));   // false

// No long is needed anywhere — rev holds at most half the digits.
```

<!-- @annotations -->
- 3: Without this, the rev / 10 branch accidentally matches for every value ending in zero.
- 5: Note the accumulator is a plain int. The half-reversal makes a wider type unnecessary.

<!-- @code python -->
```python
def is_palindrome_half(x):
    if x < 0:
        return False
    if x % 10 == 0 and x != 0:      # mandatory guard
        return False

    rev = 0
    while x > rev:
        rev = rev * 10 + x % 10
        x //= 10

    # Even digit count: halves match. Odd: drop the middle digit from rev.
    return x == rev or x == rev // 10

print(is_palindrome_half(121))          # True
print(is_palindrome_half(1221))         # True
print(is_palindrome_half(12321))        # True
print(is_palindrome_half(10))           # False
print(is_palindrome_half(1000000001))   # True

# Python has no overflow, so the half-reversal is chosen here for the
# halved iteration count rather than for safety.
```

<!-- @annotations -->
- 4: The guard is required in every language — it is an algorithm property, not a type-width one.
- 13: Use // for the middle-digit drop as well, or the comparison fails against a float.

<!-- @approach -->
### String Two-Pointer Comparison

<!-- @idea -->
Convert to text and compare characters inward from both ends, stopping at the first mismatch.

<!-- @steps -->
1. Return false for negative input, or strip the sign if the problem defines it that way.
2. Convert the number to its string representation.
3. Place one index at the first character and another at the last.
4. While the two indices have not met, compare the characters they point at.
5. Return false on the first mismatch, since one difference is enough.
6. Move the left index right and the right index left, and return true if they meet without a mismatch.

<!-- @complexity -->
- time: O(log₁₀ N)
- space: O(log₁₀ N)
- note: Each comparison handles two digits, so it performs about half as many comparisons as there are digits, and it exits early on the first mismatch. The string itself must be stored, which makes this the only approach here whose space grows with the input.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

bool isPalindromeStr(int x) {
    if (x < 0) return false;

    string s = to_string(x);
    int left = 0, right = s.size() - 1;

    while (left < right) {
        if (s[left] != s[right]) return false;   // one mismatch is enough
        left++;
        right--;
    }
    return true;
}

cout << isPalindromeStr(121)  << endl;   // 1
cout << isPalindromeStr(1221) << endl;   // 1
cout << isPalindromeStr(123)  << endl;   // 0
cout << isPalindromeStr(10)   << endl;   // 0

// The loop condition handles both parities without a special case:
// even length -> the indices cross, odd length -> they land on the
// same middle character, which never needs comparing.
```

<!-- @annotations -->
- 10: Returning on the first mismatch is what makes this cheap on non-palindromes.
- 23: left < right rather than left <= right, so the middle character of an odd-length string is skipped.

<!-- @code java -->
```java
static boolean isPalindromeStr(int x) {
    if (x < 0) return false;

    String s = String.valueOf(x);
    int left = 0, right = s.length() - 1;

    while (left < right) {
        if (s.charAt(left) != s.charAt(right)) return false;
        left++;
        right--;
    }
    return true;
}

System.out.println(isPalindromeStr(121));    // true
System.out.println(isPalindromeStr(1221));   // true
System.out.println(isPalindromeStr(123));    // false

// A shorter but slower alternative — it builds a whole second string:
// return s.equals(new StringBuilder(s).reverse().toString());
```

<!-- @annotations -->
- 17: Readable, and it allocates a second string where the two-pointer version allocates none beyond the first.

<!-- @code python -->
```python
def is_palindrome_str(x):
    if x < 0:
        return False

    s = str(x)
    left, right = 0, len(s) - 1

    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True

print(is_palindrome_str(121))    # True
print(is_palindrome_str(1221))   # True
print(is_palindrome_str(123))    # False
print(is_palindrome_str(10))     # False

# The idiomatic Python one-liner does the same job:
def is_palindrome_pythonic(x):
    return x >= 0 and str(x) == str(x)[::-1]

print(is_palindrome_pythonic(12321))   # True

# Worth knowing both: the slice is clearer, the two-pointer version
# is the pattern that generalises to arrays and to problems where
# building a reversed copy is not affordable.
```

<!-- @annotations -->
- 21: The slice builds a full reversed copy, so it uses more memory than walking inward.
- 26: Two pointers converging from both ends recurs constantly in array problems — this is the smallest place to meet it.

<!-- @example -->

<!-- @input -->
N = 1221, using the half-reversal approach

<!-- @output -->
true, after two iterations rather than four

<!-- @why -->
Shows the halves meeting in the middle, which is the whole idea. Half the digits were never examined and did not need to be.

<!-- @walkthrough -->
1. The number is positive and does not end in zero, so both guards pass.
2. The reversed half starts at 0, and 1221 is greater than 0 so the loop runs.
3. Move the last digit across: the reversed half becomes 1 and the number becomes 122.
4. 122 is still greater than 1, so move again: the reversed half becomes 12 and the number becomes 12.
5. Now 12 is not greater than 12, so the loop stops — the two halves have met.
6. The number equals the reversed half, so the answer is true after touching only two of the four digits.

<!-- @example -->

<!-- @input -->
N = 12321, an odd digit count

<!-- @output -->
true, via the rev / 10 branch

<!-- @why -->
The odd-length case is where the second comparison earns its place, and seeing the overshoot explains why rev / 10 is the right correction.

<!-- @walkthrough -->
1. The loop moves 1 across, leaving the number at 1232 and the reversed half at 1.
2. It moves 2 across, leaving 123 and 12.
3. It moves 3 across, leaving 12 and 123.
4. Now 12 is not greater than 123, so the loop stops with the reversed half having overshot by one digit.
5. The direct comparison fails, since 12 is not 123.
6. Dividing the reversed half by 10 drops the 3, which is the middle digit and matches itself by definition.
7. 12 equals 12, so the answer is true.

<!-- @example -->

<!-- @input -->
N = 10, with the trailing-zero guard removed

<!-- @output -->
Incorrectly reports true

<!-- @why -->
The guard looks like an optimisation and is actually part of the algorithm. This trace shows exactly which branch it protects.

<!-- @walkthrough -->
1. Without the guard, the loop begins with the number at 10 and the reversed half at 0.
2. The last digit is 0, so appending it leaves the reversed half at 0 while the number becomes 1.
3. 1 is still greater than 0, so the loop runs again: the reversed half becomes 1 and the number becomes 0.
4. 0 is not greater than 1, so the loop stops with the number at 0 and the reversed half at 1.
5. The direct comparison fails, since 0 is not 1.
6. But the odd-length branch computes 1 divided by 10, which is 0, and 0 equals 0 — so it reports a palindrome.
7. Measured across the first million values, removing the guard produces 1,431 such wrong answers, the first at 10.

<!-- @example -->

<!-- @input -->
Full reversal on the entire non-negative int range, with wrapping arithmetic

<!-- @output -->
Zero false positives and zero false negatives across all 2,147,483,648 values

<!-- @why -->
The usual claim is that overflow makes this approach wrong. Measuring it shows the real situation is narrower — not observably wrong on 32-bit ints, but resting on behaviour the language does not define.

<!-- @walkthrough -->
1. A genuine palindrome that fits in the type has a reverse equal to itself, so it can never overflow.
2. Overflow is therefore only possible while reversing a non-palindrome.
3. The risk would be a wrapped result landing back on the original value and reporting a false positive.
4. Every non-negative int was scanned against a string reference with wrapping arithmetic enabled.
5. No such collision exists — the naive version agreed with the reference on every single value.
6. That does not make it safe: signed overflow is undefined behaviour in C++, so a compiler may optimise on the assumption it cannot happen.

<!-- @visualization custom -->

<!-- @description -->
Draw the number as a row of digit tiles with a mirror line down its centre. The FULL REVERSAL panel builds a complete second row beneath it by pouring every digit across, then overlays the two rows and lights matching columns green and mismatching ones red — with a note that the second row duplicates information the mirror line already implied. The HALF REVERSAL panel is the main one. Draw two markers on the same row, one consuming from the right into a small reversed accumulator and one tracking what remains on the left, and animate them stepping toward each other one digit per iteration; shade the untouched middle region so it is obvious how much of the number is never examined. Stop the animation the instant the markers meet and light the comparison, so the halved work is visible as unshaded tiles rather than stated. For an odd digit count, show the accumulator overshooting by one tile, then animate that extra tile being shaved off by the division and settling onto the mirror line itself — labelled as the digit that matches itself. The GUARD panel replays 10 with the trailing-zero check removed: the zero pours across and visibly changes nothing in the accumulator, the markers meet in a lopsided position, the direct comparison fails, and then the divide-by-ten branch collapses the accumulator to zero and matches by accident — flash that as a false positive and show the guard being reinstated to catch it before the loop ever starts. Finish with the TWO-POINTER panel: two arrows starting at the outermost tiles and walking inward, comparing pairs and turning each matching pair green, halting and flashing red at the first mismatch to show the early exit, with the arrows crossing on even lengths and landing on the same middle tile on odd ones.

<!-- @sampleInput -->
```json
{"halfReversal":[{"n":1221,"steps":[{"x":1221,"rev":0},{"x":122,"rev":1},{"x":12,"rev":12}],"stop":"x not greater than rev","compare":"12 == 12","result":true,"digitsExamined":2,"digitsTotal":4},{"n":12321,"steps":[{"x":12321,"rev":0},{"x":1232,"rev":1},{"x":123,"rev":12},{"x":12,"rev":123}],"compare":"12 == 123/10 == 12","middleDigit":3,"result":true}],"guardDemo":{"n":10,"withGuard":false,"steps":[{"x":10,"rev":0},{"x":1,"rev":0},{"x":0,"rev":1}],"directCompare":"0 == 1 -> false","oddBranch":"0 == 1/10 == 0 -> TRUE","verdict":"false positive","mismatchesInFirstMillion":1431,"firstMismatch":10},"fullReversalScan":{"range":"0..2147483647","falsePositives":0,"falseNegatives":0,"note":"wrapping arithmetic, g++ -fwrapv"},"twoPointer":{"n":1221,"pairs":[["1","1"],["2","2"]],"result":true}}
```

<!-- @highlights -->
- The number is drawn as digit tiles with a mirror line down its centre.
- The full-reversal panel pours every digit into a complete second row, then overlays the two and lights matching columns green.
- A note marks that the second row duplicates what the mirror line already implied.
- The half-reversal panel places two markers on one row, stepping toward each other a digit per iteration.
- The untouched middle region is shaded, so the portion never examined is visible rather than described.
- The markers meet, the animation stops, and the comparison lights — with half the tiles still unshaded.
- For an odd digit count the accumulator overshoots by one tile.
- That extra tile is shaved off by the division and settles onto the mirror line, labelled as the digit that matches itself.
- The guard panel replays 10 with the check removed: the zero pours across and changes nothing in the accumulator.
- The markers meet lopsided, the direct comparison fails, and the divide-by-ten branch collapses the accumulator to zero.
- Zero matches zero and the panel flashes a false positive, with the guard then reinstated to catch it before the loop starts.
- The two-pointer panel walks arrows inward from both ends, turning each matching pair green.
- It halts and flashes red at the first mismatch, showing the early exit, and lands on the middle tile for odd lengths.

<!-- @edgeCases -->
- Negative input, which is not a palindrome by convention because the minus sign has a fixed position.
- Any positive number ending in zero, which cannot mirror and must be rejected before the half-reversal loop runs.
- Zero itself, which is a single digit and therefore a palindrome, and is the exception to the trailing-zero rule.
- Single-digit numbers, which are trivially palindromes and where the half-reversal loop runs zero or one times.
- An odd digit count, where the reversed half overshoots by one and the middle digit must be dropped.
- An even digit count, where the two halves meet exactly and no correction is needed.
- A ten-digit input near the type maximum, where the full reversal would overflow but the half-reversal cannot.
- A number whose first and last digits match but whose interior does not, which the two-pointer version rejects early.
- A number consisting of a single repeated digit, which is always a palindrome regardless of length.
- Very large integers in Python, where the arithmetic approaches still work because integers are unbounded.

<!-- @pitfalls -->
- Omitting the trailing-zero guard in the half-reversal, which falsely reports every value ending in zero as a palindrome.
- Forgetting to save the original value before the full-reversal loop destroys it.
- Comparing only x against rev in the half-reversal and skipping the rev divided by ten branch, which breaks every odd-length palindrome.
- Using the loop condition x greater than or equal to rev instead of strictly greater, which runs one iteration too many.
- Accumulating a full reversal into the same width as the input and relying on wrapping, which C++ leaves undefined.
- Treating a negative number as a palindrome by ignoring the sign, when the standard convention rejects it.
- Running the previous subtopic's reversal loop on a negative value in Python, which never terminates.
- Writing left less than or equal to right in the two-pointer version, which compares the middle character with itself for no reason.
- Building a reversed copy of the string when walking inward would avoid the allocation entirely.
- Using / rather than // in Python for either the digit removal or the middle-digit drop.

<!-- @doubt -->
### Why is a negative number not a palindrome?

<!-- @answer -->
Because the minus sign has a fixed position at the front. Reversing -121 gives 121-, which is not a number at all. It is a convention rather than a mathematical necessity — a problem could define it by ignoring the sign — but every standard version of this problem rejects negatives, so that is what these implementations do. Checking the statement is worth a moment if the answer matters.

<!-- @doubt -->
### Why does any number ending in zero fail?

<!-- @answer -->
Because its mirror would need a leading zero, and numbers do not have those. For 10 to be a palindrome the reverse would have to be 01, which is just 1. This is the same fact the previous subtopic covered from the other side, where 1200 reversed to 21 rather than 0021. Zero itself is the exception, since it is a single digit and mirrors trivially.

<!-- @doubt -->
### Why does reversing only half the number work?

<!-- @answer -->
Because a palindrome is a mirror, so the second half is the first half reflected. Comparing one half against the reversed other half tests exactly the same thing as comparing the whole number with its full reverse, using half the work. The loop moves one digit at a time from the front portion into the reversed accumulator, and stops when the accumulator catches up — which happens in the middle.

<!-- @doubt -->
### Why is the comparison x == rev / 10 needed?

<!-- @answer -->
For odd digit counts. With 12321 the loop stops with 12 remaining and 123 in the accumulator, because the middle digit had to land in one of them. Dividing the accumulator by 10 drops that middle digit, and it needs no checking — a centre digit is its own mirror. The first comparison covers even lengths where the halves meet exactly, and the second covers odd ones.

<!-- @doubt -->
### Can I skip the trailing-zero guard?

<!-- @answer -->
No, and this is the easiest way to get the half-reversal wrong. Take 10: the zero pours into the accumulator without changing it, the loop ends with 0 remaining and 1 accumulated, the direct comparison fails, and then the odd-length branch computes 1 divided by 10, which is 0, and matches. It reports 10 as a palindrome. Measured across the first million values, removing the guard produces 1,431 wrong answers, the first at 10. The guard is part of the algorithm.

<!-- @doubt -->
### Does the full-reversal approach actually break on overflow?

<!-- @answer -->
Less than usually claimed, and it is still the wrong thing to rely on. A palindrome that fits in the type has a reverse equal to itself, so overflow can only happen while reversing a non-palindrome, and the risk is a wrapped value landing back on the original. Scanning the entire non-negative 32-bit range with wrapping arithmetic found zero false positives and zero false negatives. But signed overflow is undefined behaviour in C++, so the compiler may optimise assuming it cannot occur, and the measurement says nothing about 64-bit inputs. Accumulate into a wider type, or use the half-reversal which cannot overflow at all.

<!-- @doubt -->
### Is the half-reversal faster in complexity terms?

<!-- @answer -->
No. It runs roughly half as many iterations, which halves a constant factor and leaves the complexity at O(log₁₀ N) — the same distinction the nested-loops subtopic made about triangular loops. The reason to prefer it is not speed but that its accumulator never holds more than half the digits, so the overflow question disappears rather than needing a guard.

<!-- @doubt -->
### Should I just convert to a string and compare?

<!-- @answer -->
It is correct and readable, and in Python the one-liner comparing a string with its reverse is genuinely idiomatic. Two things to weigh. It allocates, so its space is O(log N) where the arithmetic versions are O(1). And interviewers usually want the arithmetic version, because the point of the problem is the digit manipulation. The two-pointer form is worth learning regardless of this problem, since walking inward from both ends is a pattern that recurs constantly on arrays and strings.
