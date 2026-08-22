---
id: check-if-string-is-palindrome-or-not
topic: Basic Recursion
title: Check if String is Palindrome or Not
difficulty: Easy
status: ready
prerequisites:
  - reverse-an-array
  - factorial-of-a-given-number
  - sum-of-first-n-numbers
  - data-types
  - stack-memory-and-recursion-depth
relatedIds:
  - reverse-an-array
  - fibonacci-number
  - factorial-of-a-given-number
  - stack-memory-and-recursion-depth
---

<!-- @summary -->
The same two pointers as Reverse an array, comparing instead of swapping — and that one change makes the cost depend on the input for the first time in this topic. On random text the recursion stops after about 1.04 comparisons no matter how long the string is; only an actual palindrome costs n/2. Which is why the obviously wasteful reverse-and-compare is 169x slower on random input and 4.55x faster on real palindromes.

<!-- @theory -->
## The problem

Return whether a string reads the same forwards and backwards.

```
"abcba"  ->  true
"abca"   ->  false
""       ->  true
```

## One operator away from the last subtopic

```
reverse(arr, l, r):                  isPalindrome(s, l, r):
    if l >= r: return                    if l >= r: return true
    swap(arr[l], arr[r])                 if s[l] != s[r]: return false
    reverse(arr, l + 1, r - 1)           return isPalindrome(s, l+1, r-1)
```

Identical window, identical shrinking, identical base-case test. Three things
changed and each one matters:

1. It **compares** instead of swapping, so it reads memory rather than writing it.
2. It **returns a value** again, so the base case has to answer a question.
3. It can **stop early**, which nothing in this topic has been able to do before.

## The cost is not n/2 — it is usually 1

Reverse an array always spends exactly `floor(n/2)` frames. This one spends
however many it takes to find the first mismatched pair, and on anything that is
not deliberately palindromic that is almost immediately. Measured over 200,000
random strings per row:

| Alphabet | n | Mean comparisons | Longest run | n/2 |
|---|---|---|---|---|
| 2 letters | 100 | 1.9962 | 25 | 50 |
| 2 letters | 1,000 | **1.9967** | 22 | 500 |
| 4 letters | 1,000 | 1.3323 | 11 | 500 |
| 26 letters | 100 | 1.0402 | 5 | 50 |
| 26 letters | 1,000 | **1.0406** | 4 | 500 |

Two things to notice. The mean does not move with n at all — 1.9962 at n = 100
and 1.9967 at n = 1,000 — and it lands exactly where the arithmetic says it
should. Each pair matches with probability `1/k`, so the number of comparisons
before the first mismatch is geometric with mean `k/(k-1)`:

| k | Predicted `k/(k-1)` | Measured |
|---|---|---|
| 2 | 2.0000 | 1.9962 |
| 4 | 1.3333 | 1.3336 |
| 26 | 1.0400 | 1.0402 |

So the average case is **O(1)**, not O(n). The cost is exactly `position of the
first mismatch + 1`, and only a genuine palindrome pays the full n/2:

| Input at n = 1,000 | Comparisons |
|---|---|
| First differing index 0 | 1 |
| First differing index 10 | 11 |
| First differing index 100 | 101 |
| An actual palindrome | **500** |

## Which turns the obvious ranking upside down

The lazy way to check a palindrome is to reverse the string and compare. It looks
strictly worse: it allocates a whole second string and reads every character,
where the two-pointer version usually reads two. Measured at n = 10,000:

| | Random string | Actual palindrome |
|---|---|---|
| Two-pointer recursion | **1.4ns** | 2,285.0ns |
| Two-pointer loop | 1.4ns | 2,279.3ns |
| `std::equal` with `rbegin` | 1.7ns | 2,230.3ns |
| Reverse and compare | 236.7ns | **501.7ns** |

On random input the two-pointer wins by **169x**, exactly as expected. On an
actual palindrome it **loses by 4.55x**.

The reason is throughput. Reverse-and-compare is a `memcpy` followed by a
`memcmp`, both hand-vectorised in libc, and it moved 2 × 10,000 bytes in 501.7ns —
**39.9 bytes per nanosecond**. The two-pointer walks the string one character at a
time with a data-dependent branch on every step, and managed **4.4 bytes per
nanosecond**. That is 9.1x per byte; it reads half as many bytes, so the net is
4.55x.

So the choice is not "clever versus wasteful". It is a bet on the input. If the
answer is usually `false`, the early exit is worth 169x. If you are validating
strings you expect to *be* palindromes, copying is worth 4.55x.

## The bet flips back when you have to normalise

Real palindrome questions ignore case and punctuation — "A man, a plan, a canal:
Panama". That destroys the copying advantage, because a cleaned string has to be
built one character at a time through `isalnum` and `tolower`, and there is no
`memcpy` for that. Measured at n = 12,000:

| | Palindrome | Not a palindrome |
|---|---|---|
| Normalise in place, two pointers | **20,954.9ns** | **5.1ns** |
| Build a cleaned copy first | 40,132.5ns | 38,023.6ns |

Now the in-place version wins both cases — 1.92x on a palindrome and **7,455x**
on a non-palindrome, because it still has its early exit and the copy no longer
has vectorisation to offer. The moment the comparison stops being a raw byte
compare, the reversal disappears.

## The base case has to answer a question

Sum returned 0, factorial returned 1, and Reverse an array returned nothing at
all. Here the base case is reached when the window is empty or a single
character, and the answer it must give is **true** — a string with nothing left to
check has no mismatched pair in it, so it is vacuously a palindrome. That is the
same identity-element choice in a different costume: `true` is what leaves a chain
of `&&` unchanged.

Getting it wrong is total, not partial:

| Base case | `""` | `"a"` | `"aba"` | `"abba"` | `"abca"` |
|---|---|---|---|---|---|
| `if (l >= r) return true` | true | true | true | true | false |
| `if (l >= r) return false` | **false** | **false** | **false** | **false** | false |

Every answer becomes `false`, for every input — the same shape of failure as
returning 0 from factorial's base case.

## The l == r trap, and what makes it hard to find

Reverse an array had this same trap: writing `l == r` instead of `l >= r` misses
even lengths, because the two indices cross without ever being equal. Here it
behaves differently, and worse.

For a **non**-palindrome the early exit fires before the pointers can cross, so
the answer is correct. For an even-length **palindrome** there is no mismatch to
stop it, so it keeps comparing mirrored pairs — which keep matching — and walks
off the end of the string.

Checked exhaustively over every binary string of length 0 to 14, 32,767 in total:

| | Count |
|---|---|
| Handled correctly | 32,512 |
| Ran off the end, true answer was **true** | **255** |
| Ran off the end, true answer was **false** | **0** |

Those 255 are exactly the even-length palindromes — 1 + 2 + 4 + … + 128. The bug
never returns a wrong `false`. It only breaks when the answer should be `true`,
which means a test suite full of negative cases passes completely.

## It is still a tail call

Both spellings — the explicit `if` and the short-circuiting `&&` — leave nothing
pending after the recursive call:

| | `-O0` | `-O1` | `-O2` |
|---|---|---|---|
| `s[l]==s[r] && isPal(l+1,r-1)` | 1 self-call, 50 instrs | **0**, 19 instrs | 0, 20 instrs |
| `if (s[l]!=s[r]) return false;` | 1 self-call, 52 instrs | **0**, 19 instrs | 0, 20 instrs |

Nineteen instructions either way, and the two compile to the same thing. The depth
limit goes with it: at `-O0` the longest all-identical string it can check is
**348,510** — the same n/2 frame pattern and the same 48-byte frame as Reverse an
array — and at `-O2` it completed 199,999,237.

## Python inverts it again

At n = 1,500:

| | Random string | Actual palindrome |
|---|---|---|
| Recursion | **87.5ns** | 64,350.2ns |
| Loop | 82.2ns | 35,578.3ns |
| `s == s[::-1]` | 795.9ns | **792.4ns** |

The slice is flat — 795.9 and 792.4 — because it always does the same work
regardless of the answer. Against it the two-pointer is 9.7x faster on random
input and **81x slower** on a palindrome. The gap is much wider than in C++
because the interpreted loop pays per character while the slice runs in C.

## Where this goes next

**Fibonacci** makes the change this topic has been building toward: the function
calls itself **twice**. Every recursion so far has produced a chain of frames, one
per level, doing a fixed amount of work in each. Two calls produce a tree, the
frame count stops being proportional to n, and for the first time the recursion
itself — rather than the type, the stack, or the input — is the thing that has to
be fixed.

<!-- @intuition -->
A string is a palindrome when its first and last characters match and everything between them is a palindrome too. That is the recursion, and it is the same shrinking window as reversing an array with one word changed: compare instead of swap. What is new is that this function can give up. Reversing always had to visit every pair; comparing can stop the instant it finds two characters that differ, and on ordinary text that happens almost immediately — about one comparison, no matter how long the string is. So the interesting question stops being how fast the loop runs and becomes what you expect the answer to be. If it is usually no, the early exit is everything. If you are checking strings that really are palindromes, a version that copies the whole string and compares it in one vectorised sweep beats it outright.

<!-- @approach -->
### Iteration - Two Pointers

<!-- @idea -->
Compare the ends and walk inward, stopping at the first pair that differs.

<!-- @steps -->
1. Put one index at the first character and one at the last.
2. While the left index is strictly less than the right, compare the two characters.
3. If they differ, return false immediately — nothing further can change the answer.
4. Otherwise step both indices inward.
5. If the loop finishes without a mismatch, return true.

<!-- @complexity -->
- time: O(n) worst case, O(1) on average — measured 1.0402 comparisons on random 26-letter strings, independent of n
- space: O(1)
- note: The cost is exactly the position of the first mismatch plus one, so only a genuine palindrome pays n/2. Measured 1.4ns on a random string of 10,000 characters against 2,279.3ns on a palindrome of the same length.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

bool isPalindrome(const string& s) {
    int l = 0, r = (int)s.size() - 1;

    while (l < r) {
        if (s[l] != s[r]) return false;
        l++;
        r--;
    }
    return true;
}
```

<!-- @annotations -->
- 5: r is int, not size_t. An empty string gives size() - 1 as a huge unsigned value and the first comparison reads out of bounds.
- 8: Returning as soon as a pair differs is the whole of the average-case behaviour — on random text this fires on the first iteration.
- 12: Reaching here means no pair differed, which includes the empty and single-character cases where the loop never ran.

<!-- @code java -->
```java
static boolean isPalindrome(String s) {
    int l = 0, r = s.length() - 1;

    while (l < r) {
        if (s.charAt(l) != s.charAt(r)) return false;
        l++;
        r--;
    }
    return true;
}
```

<!-- @annotations -->
- 2: s.length() is an int, so the empty-string underflow that C++ allows with size_t cannot happen here.

<!-- @code python -->
```python
def is_palindrome(s):
    l, r = 0, len(s) - 1
    while l < r:
        if s[l] != s[r]:
            return False
        l += 1
        r -= 1
    return True


# Measured 82.2ns on a random 1,500-character string against 35,578.3ns
# on an actual palindrome of the same length — the early exit is
# doing almost all of the work.
```

<!-- @annotations -->
- 4: The early return is what makes the random case fast; without it this would always cost n/2 iterations.
- 11: Against s == s[::-1] this is 9.7x faster on random input and 45x slower on a real palindrome.

<!-- @approach -->
### Recursion - Compare the Ends

<!-- @idea -->
The ends must match and the string between them must itself be a palindrome.

<!-- @steps -->
1. Take the string and the two ends of the window, l and r.
2. If l is greater than or equal to r, the window is empty or a single character, so return true.
3. If the characters at l and r differ, return false without recursing.
4. Otherwise call the function on the window from l plus one to r minus one.
5. Return that result directly, with no work after the call.

<!-- @complexity -->
- time: O(n) worst case, O(1) average
- space: O(n/2) call stack as written, O(1) at -O1 and above
- note: A tail call in both spellings — the explicit if and the short-circuiting && compile to the same 19 instructions at -O1 with zero self-calls. At -O0 the longest all-identical string it checks is 348,510, the same n/2 frame pattern as Reverse an array; at -O2 it completed 199,999,237. The base case must return true, and writing l == r instead of l >= r breaks exactly the even-length palindromes.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

bool isPalindrome(const string& s, int l, int r) {
    if (l >= r) return true;             // nothing left to check
    if (s[l] != s[r]) return false;      // one mismatch settles it

    return isPalindrome(s, l + 1, r - 1);
}

bool isPalindrome(const string& s) { return isPalindrome(s, 0, (int)s.size() - 1); }
```

<!-- @annotations -->
- 5: return true, not false. An empty window has no mismatched pair in it, so it is vacuously a palindrome — writing false makes every answer false for every input.
- 5: l >= r, not l == r. On an even-length palindrome the indices cross without meeting and the recursion walks off the string — measured on exactly 255 of the 32,767 binary strings up to length 14, every one of them an even-length palindrome.
- 6: This line is why the average case is O(1) — on random 26-letter text it fires after about 1.04 comparisons regardless of length.
- 8: Nothing is pending after the call, so -O1 compiles this to a loop with zero self-calls remaining.

<!-- @code java -->
```java
static boolean isPalindrome(String s, int l, int r) {
    if (l >= r) return true;
    if (s.charAt(l) != s.charAt(r)) return false;

    return isPalindrome(s, l + 1, r - 1);
}

static boolean isPalindrome(String s) { return isPalindrome(s, 0, s.length() - 1); }
```

<!-- @annotations -->
- 5: The JVM performs no tail-call elimination, so a long palindrome keeps one frame per two characters and can throw StackOverflowError.

<!-- @code python -->
```python
def is_palindrome(s, l=None, r=None):
    if l is None:
        l, r = 0, len(s) - 1
    if l >= r:
        return True
    if s[l] != s[r]:
        return False
    return is_palindrome(s, l + 1, r - 1)


# Measured 87.5ns on a random 1,500-character string and 64,350.2ns
# on a palindrome of the same length — a 735x spread from the same
# function, decided entirely by the input.
```

<!-- @annotations -->
- 2: Defaulting to None rather than to len(s) - 1, since a default argument is evaluated once at definition time and cannot see the caller's string.
- 5: True, not False — the same identity choice that 0 was for the sum and 1 was for the factorial.

<!-- @approach -->
### Reverse and Compare

<!-- @idea -->
Build the reversed string and test the two for equality.

<!-- @steps -->
1. Construct a second string holding the characters in reverse order.
2. Compare it with the original for equality.
3. Return the result of that comparison.
4. Accept that it always reads the whole string, whatever the answer is.
5. Prefer it only when the inputs are expected to be palindromes.

<!-- @complexity -->
- time: O(n) always, with no early exit
- space: O(n) for the copy
- note: The interesting result of this subtopic. It is a memcpy followed by a memcmp, both vectorised in libc, and moved 39.9 bytes per nanosecond against the two-pointer loop's 4.4 — so despite reading twice as many bytes it measured 4.55x FASTER on an actual palindrome, 501.7ns against 2,285.0ns at n = 10,000. On random input it is 169x slower, because it copies 10,000 characters to answer a question the two-pointer settles in about one comparison.

<!-- @code cpp -->
```cpp
#include <string>
#include <algorithm>
using namespace std;

bool isPalindrome(const string& s) {
    string t(s.rbegin(), s.rend());
    return s == t;
}

// No allocation, same early-exit behaviour as the two-pointer loop:
bool isPalindromeNoCopy(const string& s) {
    return equal(s.begin(), s.begin() + s.size() / 2, s.rbegin());
}
```

<!-- @annotations -->
- 6: This allocation is the entire cost on random input — 236.7ns against the two-pointer's 1.4ns at n = 10,000.
- 7: The comparison itself is memcmp, which is where the 4.55x advantage on real palindromes comes from.
- 12: std::equal against a reverse iterator reads at most n/2 characters and allocates nothing — measured 1.7ns on random input and 2,230.3ns on a palindrome, so it behaves like the two-pointer version rather than like the copy.

<!-- @code java -->
```java
static boolean isPalindrome(String s) {
    return s.equals(new StringBuilder(s).reverse().toString());
}
```

<!-- @annotations -->
- 2: Two allocations here, the StringBuilder and the String it produces, so this is the most expensive form when the answer is usually false.

<!-- @code python -->
```python
def is_palindrome(s):
    return s == s[::-1]


# Flat regardless of the answer: measured 795.9ns on a random
# 1,500-character string and 792.4ns on a palindrome. That makes it
# 9.7x slower than the two-pointer loop on random input and 45x
# faster on an actual palindrome.
```

<!-- @annotations -->
- 2: The idiomatic Python answer, and the right default — its worst case is its only case, which is easy to reason about.

<!-- @approach -->
### Skip What Doesn't Count

<!-- @idea -->
Ignore anything that is not a letter or digit, and compare without regard to case.

<!-- @steps -->
1. Advance the left index past any character that is not alphanumeric.
2. Retreat the right index past any character that is not alphanumeric.
3. If the indices have met or crossed, return true.
4. Compare the two characters case-insensitively and return false if they differ.
5. Otherwise recurse on the window between them.

<!-- @complexity -->
- time: O(n) worst case, O(1) average
- space: O(1)
- note: This is the version real palindrome questions ask for, and it is where the copying trick stops paying. A cleaned copy has to be built character by character through isalnum and tolower, so there is no memcpy to vectorise — measured at n = 12,000 the in-place form won both cases, 20,954.9ns against 40,132.5ns on a palindrome and 5.1ns against 38,023.6ns on a non-palindrome, a factor of 7,455.

<!-- @code cpp -->
```cpp
#include <string>
#include <cctype>
using namespace std;

bool isPalindrome(const string& s, int l, int r) {
    while (l < r && !isalnum((unsigned char)s[l])) l++;
    while (l < r && !isalnum((unsigned char)s[r])) r--;

    if (l >= r) return true;
    if (tolower((unsigned char)s[l]) != tolower((unsigned char)s[r])) return false;

    return isPalindrome(s, l + 1, r - 1);
}

bool isPalindrome(const string& s) { return isPalindrome(s, 0, (int)s.size() - 1); }
```

<!-- @annotations -->
- 6: The l < r guard inside the skip loops matters — without it a string of pure punctuation walks the index past the end.
- 6: Casting to unsigned char before isalnum, because passing a negative char is undefined behaviour for these functions.
- 9: Checked after skipping, not before, since the skipping is what can make the window empty.
- 10: Case folding on both sides rather than pre-lowercasing the string, which is what keeps this allocation-free.

<!-- @code java -->
```java
static boolean isPalindrome(String s, int l, int r) {
    while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
    while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;

    if (l >= r) return true;
    if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;

    return isPalindrome(s, l + 1, r - 1);
}
```

<!-- @annotations -->
- 2: Character.isLetterOrDigit is Unicode-aware, so this accepts letters outside ASCII where the C++ version does not.

<!-- @code python -->
```python
def is_palindrome(s, l=None, r=None):
    if l is None:
        l, r = 0, len(s) - 1
    while l < r and not s[l].isalnum():
        l += 1
    while l < r and not s[r].isalnum():
        r -= 1
    if l >= r:
        return True
    if s[l].lower() != s[r].lower():
        return False
    return is_palindrome(s, l + 1, r - 1)


# The one-liner equivalent, which allocates a cleaned copy:
#     t = [c.lower() for c in s if c.isalnum()]; return t == t[::-1]
```

<!-- @annotations -->
- 4: str.isalnum() is Unicode-aware and returns False for the empty string, so the guard cannot run past the end.
- 15: The comprehension is shorter and reads better, at the cost of building a list the length of the input before deciding anything.

<!-- @example -->

<!-- @input -->
"abcba" through the recursion

<!-- @output -->
true — three frames, two comparisons

<!-- @why -->
The same shrinking window as Reverse an array, now returning a value up the chain instead of leaving its effect behind.

<!-- @walkthrough -->
1. isPalindrome(s, 0, 4) compares 'a' with 'a'. They match, so it cannot decide yet and recurses on the window 1 to 3.
2. That frame compares 'b' with 'b'. They match, so it recurses on the window 2 to 2.
3. That frame finds l equal to r, matches the base case, and returns true.
4. The single middle character is its own mirror, so there is nothing for it to check.
5. That true is returned unchanged through both frames above — neither modifies it.
6. Two comparisons were performed for five characters, which is floor(5/2).
7. Unlike Reverse an array the frames do carry a value, but unlike Sum of First N Numbers none of them does any work with it on the way out.

<!-- @example -->

<!-- @input -->
200,000 random strings per alphabet size, counting comparisons

<!-- @output -->
About k/(k-1) comparisons, and it does not change with n

<!-- @why -->
It is the measurement that makes this problem different from every earlier one in the topic — the cost stops being a function of the input size and becomes a function of the input's content.

<!-- @walkthrough -->
1. Each pair of characters matches with probability 1 over the alphabet size, so the number of comparisons before the first mismatch is geometric.
2. The mean of that distribution is k divided by k minus one.
3. For a two-letter alphabet that predicts 2.0000 and the measurement was 1.9962.
4. For four letters it predicts 1.3333 and the measurement was 1.3336.
5. For twenty-six letters it predicts 1.0400 and the measurement was 1.0402.
6. Crucially the figure does not move with n — 1.9962 at n = 100 and 1.9967 at n = 1,000 for the same alphabet.
7. So the average case is O(1), and the only inputs that cost n/2 are the palindromes themselves.

<!-- @example -->

<!-- @input -->
Two-pointer versus reverse-and-compare, on random text and on a real palindrome

<!-- @output -->
169x one way, 4.55x the other

<!-- @why -->
It is the clearest case in this topic of an algorithm's ranking depending on the input rather than on the algorithm, and the mechanism is measurable rather than hand-waved.

<!-- @walkthrough -->
1. At n = 10,000 on random strings the two-pointer recursion measured 1.4ns and reverse-and-compare 236.7ns, a factor of 169.
2. That is expected: one settles in about one comparison and the other copies ten thousand characters first.
3. On an actual palindrome of the same length the two-pointer measured 2,285.0ns and reverse-and-compare 501.7ns.
4. So the copy is 4.55x faster precisely where the early exit cannot help.
5. The mechanism is throughput: the copy is a memcpy plus a memcmp, both vectorised in libc, moving 39.9 bytes per nanosecond.
6. The two-pointer walks one character at a time with a branch that depends on the data, managing 4.4 bytes per nanosecond.
7. That is 9.1x per byte against reading twice as many bytes, which is the 4.55x.

<!-- @example -->

<!-- @input -->
The base case written as l == r, over every binary string of length 0 to 14

<!-- @output -->
255 failures out of 32,767, and every one of them is an even-length palindrome

<!-- @why -->
It shows a bug that is invisible to negative test cases, which is the opposite of how most off-by-one errors behave.

<!-- @walkthrough -->
1. For a string that is not a palindrome, the mismatch check returns false before the indices can cross, so the answer is right.
2. For an even-length palindrome there is no mismatch to stop it and the indices step past each other without ever being equal.
3. It then keeps comparing mirrored pairs, which keep matching, and walks off the end of the string.
4. Over all 32,767 binary strings up to length 14, 32,512 were handled correctly.
5. 255 ran off the end, and the true answer for every one of them was true.
6. Zero failures had a true answer of false — the bug cannot produce a wrong false.
7. Those 255 are exactly the even-length palindromes, 1 + 2 + 4 + … + 128, so any test suite made mostly of negative cases passes it completely.

<!-- @visualization array -->

<!-- @description -->
The string as a horizontal strip of character cells with two markers beneath it, deliberately reusing the layout from Reverse an array so the single changed operation is what stands out. Run "abcba": each frame highlights the two cells the markers sit on and draws a comparison link between them rather than the crossing swap arc the previous subtopic used — equal pairs light the link green and the markers step inward, and the frame column on the left now carries a result slot rather than the empty one reverse had. When the markers land on the middle cell, mark it as its own mirror and return true, then show that true travelling straight up through every frame unchanged, with each frame's slot filling with the same value — the contrast with Sum of First N Numbers, where each frame changed the value on the way out, should be explicit. Beside it run "abcda" on the same layout: the first pair matches, the second does not, the link flashes red and every frame above collapses at once to false without the remaining cells ever being read — grey out the untouched middle of the strip and label it never looked at. The centre panel is the cost distribution and is the important one: a histogram of comparisons performed over 200,000 random strings, which should be almost entirely a single bar at 1, with a visible but tiny tail out to about 5, and a dashed line far to the right at n/2 labelled where a palindrome lands. Put three alphabet sizes side by side with their measured means printed — 1.9962, 1.3336, 1.0402 — and the predicted k/(k-1) underneath each, so the match is visible rather than asserted. Below that the reversal panel: two paired bars for two-pointer against reverse-and-compare, one pair on random input where the two-pointer bar is invisible next to a long one, one pair on a palindrome where the lengths swap, annotated 169x and 4.55x, with a small throughput readout of 4.4 against 39.9 bytes per nanosecond explaining why. Finally the trap panel: run the l == r version on "abba", let the markers cross past each other still matching, and carry them off both ends of the strip into greyed cells, with a counter reading 255 of 32,767 broken — all even-length palindromes, 0 wrong false answers.

<!-- @sampleInput -->
```json
{"primary":{"input":"abcba","form":"two-pointer recursion","frames":[{"window":[0,4],"compare":["a","a"],"match":true},{"window":[1,3],"compare":["b","b"],"match":true},{"window":[2,2],"baseCase":true,"returns":true,"note":"middle character is its own mirror"}],"result":true,"comparisons":2,"framesUsed":3,"valueTravelsUpUnchanged":true,"contrastWithEarlier":{"reverseAnArray":"same window, swaps instead of comparing, frames carry no value","sumOfFirstN":"each frame changed the value on the way out; here none of them does"}},"earlyExit":{"input":"abcda","frames":[{"window":[0,4],"compare":["a","a"],"match":true},{"window":[1,3],"compare":["b","d"],"match":false,"returns":false}],"result":false,"comparisons":2,"charactersNeverRead":"the middle of the string is never looked at"},"costDistribution":{"trials":200000,"rule":"comparisons = index of first mismatch + 1","meanIsGeometric":"k/(k-1), independent of n","rows":[{"alphabet":2,"n":100,"mean":1.9962,"max":25,"nOver2":50,"predicted":2.0000},{"alphabet":2,"n":1000,"mean":1.9967,"max":22,"nOver2":500,"predicted":2.0000},{"alphabet":4,"n":100,"mean":1.3336,"max":9,"nOver2":50,"predicted":1.3333},{"alphabet":4,"n":1000,"mean":1.3323,"max":11,"nOver2":500,"predicted":1.3333},{"alphabet":26,"n":100,"mean":1.0402,"max":5,"nOver2":50,"predicted":1.0400},{"alphabet":26,"n":1000,"mean":1.0406,"max":4,"nOver2":500,"predicted":1.0400}],"byMismatchPosition":{"n":1000,"rows":[{"firstDifferingIndex":0,"comparisons":1},{"firstDifferingIndex":10,"comparisons":11},{"firstDifferingIndex":100,"comparisons":101},{"input":"actual palindrome","comparisons":500}]},"reading":"average case is O(1); only a genuine palindrome costs n/2"},"theReversal":{"n":10000,"unit":"ns, -O2, median of 9","random":{"twoPointerRecursion":1.4,"twoPointerLoop":1.4,"stdEqualRbegin":1.7,"reverseAndCompare":236.7,"factor":169},"palindrome":{"twoPointerRecursion":2285.0,"twoPointerLoop":2279.3,"stdEqualRbegin":2230.3,"reverseAndCompare":501.7,"factor":4.55},"mechanism":{"reverseAndCompare":"memcpy + memcmp, both vectorised in libc","bytesPerNsCopy":39.9,"bytesPerNsTwoPointer":4.4,"perByteRatio":9.1,"readsTwiceAsManyBytes":true},"reading":"the ranking depends on the input, not on the algorithm"},"normalising":{"n":12000,"unit":"ns","palindrome":{"inPlaceTwoPointer":20954.9,"cleanedCopy":40132.5,"factor":1.92},"notPalindrome":{"inPlaceTwoPointer":5.1,"cleanedCopy":38023.6,"factor":7455},"why":"a cleaned copy is built character by character through isalnum and tolower, so there is no memcpy to vectorise — the copying advantage disappears"},"baseCase":{"correct":"if (l >= r) return true","reason":"an empty window has no mismatched pair, so it is vacuously a palindrome — true is the identity for a chain of &&","rows":[{"written":"l >= r return true","empty":true,"a":true,"aba":true,"abba":true,"abca":false,"correct":true},{"written":"l >= r return false","empty":false,"a":false,"aba":false,"abba":false,"abca":false,"effect":"every answer is false, for every input"}],"identityChain":[{"subtopic":"Sum of First N Numbers","operation":"+","identity":0},{"subtopic":"Factorial","operation":"x","identity":1},{"subtopic":"Reverse an array","operation":"none","identity":"returns nothing"},{"subtopic":"Palindrome","operation":"&&","identity":true}]},"equalsTrap":{"written":"l == r","correctVersion":"l >= r","exhaustive":{"corpus":"every binary string of length 0..14","total":32767,"handledCorrectly":32512,"ranOffTheEndTruthTrue":255,"ranOffTheEndTruthFalse":0},"the255":"exactly the even-length palindromes — 1+2+4+...+128","whyNegativeTestsPass":"a non-palindrome hits the mismatch check before the indices can cross, so every false answer is correct","reading":"the bug can only break answers that should be true"},"tailCall":{"bothSpellingsEquivalent":true,"rows":[{"form":"s[l]==s[r] && isPal(l+1,r-1)","O0":{"selfCalls":1,"instructions":50},"O1":{"selfCalls":0,"instructions":19},"O2":{"selfCalls":0,"instructions":20}},{"form":"if (s[l]!=s[r]) return false;","O0":{"selfCalls":1,"instructions":52},"O1":{"selfCalls":0,"instructions":19},"O2":{"selfCalls":0,"instructions":20}}],"depth":{"frameBytes":48,"O0LongestAllIdenticalString":348510,"framesUsed":174255,"sameAs":"reverse-an-array","O2":199999237}},"python":{"version":"3.13.4","n":1500,"unit":"ns","random":{"recursion":87.5,"loop":82.2,"slice":795.9},"palindrome":{"recursion":64350.2,"loop":35578.3,"slice":792.4},"sliceIsFlat":"795.9 vs 792.4 — it always does the same work","ratios":{"loopVsSliceRandom":9.7,"sliceVsRecursionPalindrome":81,"sliceVsLoopPalindrome":45},"recursionSpreadFromInputAlone":735}}
```

<!-- @highlights -->
- The string is a strip of character cells with two markers beneath, reusing the layout from Reverse an array.
- Each frame draws a comparison link between the two marked cells instead of the crossing swap arc.
- Matching pairs light the link green and the markers step inward.
- The frame column now carries a result slot, where Reverse an array's was empty.
- At the middle cell the base case returns true, marked as its own mirror.
- That true travels straight up through every frame unchanged, each slot filling with the same value.
- The contrast with Sum of First N Numbers, where each frame changed the value on the way out, is made explicit.
- Beside it "abcda" runs: the second pair mismatches, the link flashes red, and every frame collapses to false at once.
- The untouched middle of that strip is greyed and labelled never looked at.
- The centre panel is a histogram of comparisons over 200,000 random strings — almost entirely one bar at 1.
- A small tail runs out to about 5, and a dashed line far right at n/2 is labelled where a palindrome lands.
- Three alphabet sizes sit side by side with measured means 1.9962, 1.3336 and 1.0402.
- The predicted k/(k-1) is printed under each, so the match is visible rather than asserted.
- The reversal panel pairs two-pointer against reverse-and-compare on random input and on a palindrome.
- The bar lengths swap between the two pairs, annotated 169x and 4.55x, with 4.4 against 39.9 bytes per nanosecond explaining why.
- The trap panel runs l == r on "abba", carrying the markers off both ends, with a counter reading 255 of 32,767 broken and 0 wrong false answers.

<!-- @edgeCases -->
- The empty string — a palindrome, and the base case must return true for it rather than false.
- A single character — also true, and the only length where l == r and l >= r cannot be distinguished.
- Two identical characters — the shortest even-length palindrome, and the shortest input the l == r bug breaks.
- Two different characters — returns false after exactly one comparison.
- An all-identical string — the worst case, since no mismatch ever stops it.
- Any even-length palindrome — the only family the l == r base case breaks, measured 255 of 32,767 binary strings up to length 14.
- A string of pure punctuation in the normalising version — the skip loops must be guarded by l < r or they run past the end.
- A string with a negative char value passed to isalnum — undefined behaviour unless cast to unsigned char first.
- n around 348,510 in C++ at -O0 — the measured stack limit for an all-identical string, the same n/2 pattern as Reverse an array.
- A long palindrome in Python — the recursion measured 64,350.2ns at n = 1,500 against the slice's 792.4ns.
- Mixed case and punctuation — "A man, a plan, a canal: Panama" is a palindrome only under the normalising version.

<!-- @pitfalls -->
- Returning false from the base case. An empty window has no mismatched pair in it, so the answer is true — writing false makes every input return false.
- Writing the base case as l == r. It is correct on every false answer and walks off the string on even-length palindromes, so a test suite of negative cases passes it completely — measured 255 failures out of 32,767, all with a true answer of true.
- Testing only with non-palindromes. That is exactly the set of inputs the l == r bug handles correctly.
- Testing only with odd-length palindromes. Those work too; the bug needs an even length to appear.
- Using size_t for the right index. An empty string gives size() - 1 as a huge value and the first comparison reads out of bounds.
- Assuming the two-pointer version is always faster. On an actual palindrome reverse-and-compare measured 4.55x faster, because memcpy and memcmp are vectorised and a character-at-a-time loop is not.
- Assuming reverse-and-compare is always slower. On random input it measured 169x slower — the ranking depends entirely on what you expect the answer to be.
- Carrying the copying trick into the normalising version. A cleaned copy cannot be memcpy'd, so the in-place form won both cases there, by 1.92x and 7,455x.
- Calling isalnum or tolower on a plain char. Values above 127 become negative and passing a negative value is undefined behaviour — cast to unsigned char.
- Omitting the l < r guard inside the skip loops. A string of pure punctuation then walks the index past the end of the string.
- Lowercasing the whole string before comparing. That allocates a copy to answer a question the two-pointer usually settles in one comparison.
- Reaching for an accumulator rewrite. Nothing is pending after the recursive call already, so -O1 leaves zero self-calls in both spellings.

<!-- @doubt -->
### Why does the base case return true?

<!-- @answer -->
Because reaching it means the window is empty or holds a single character, and neither contains a mismatched pair — so there is nothing left that could make the answer false. It is the same identity-element choice this topic keeps making, in a new costume: the sum's base case returned 0 because 0 leaves a sum alone, factorial's returned 1 because 1 leaves a product alone, and this returns true because true leaves a chain of && alone. Getting it wrong is total rather than partial. With false in the base case every input returns false, including "aba" and "abba", because the chain always ends at that value.

<!-- @doubt -->
### Why is l == r wrong here if the string is odd-length?

<!-- @answer -->
For odd lengths it is not wrong — the two indices do land on the middle character and the recursion stops. The problem is even lengths, where they cross without ever being equal. What makes it nastier than the same bug in Reverse an array is which inputs it breaks. For a non-palindrome the mismatch check fires before the indices can cross, so the answer is correct; only an even-length palindrome has no mismatch to stop it, so the recursion keeps comparing mirrored pairs that keep matching and walks off the string. Checked over every binary string up to length 14: 255 failures out of 32,767, all of them even-length palindromes, and not one wrong false. A test suite of negative cases passes it completely.

<!-- @doubt -->
### How expensive is this really?

<!-- @answer -->
On ordinary text, about one comparison — independent of the length. Each pair matches with probability 1 over the alphabet size, so the number of comparisons before the first mismatch is geometric with mean k/(k-1). Measured over 200,000 random strings that gives 1.0402 for a 26-letter alphabet against a prediction of 1.0400, and 1.9962 for a two-letter alphabet against 2.0000. The figure does not move with n: 1.9962 at n = 100 and 1.9967 at n = 1,000. So the worst case is n/2 but the average case is O(1), and the only inputs that reach the worst case are the palindromes themselves.

<!-- @doubt -->
### Isn't reversing the string and comparing just wasteful?

<!-- @answer -->
On random input, yes — measured 236.7ns against the two-pointer's 1.4ns at n = 10,000, a factor of 169, because it copies ten thousand characters to answer a question the two-pointer settles in about one comparison. On an actual palindrome it is 4.55x faster: 501.7ns against 2,285.0ns. The copy is a memcpy followed by a memcmp, both hand-vectorised in libc, and it moved 39.9 bytes per nanosecond where the character-at-a-time loop with its data-dependent branch managed 4.4. It reads twice as many bytes at 9.1x the rate. So the right choice is a bet on the input rather than a property of the algorithm.

<!-- @doubt -->
### Then which one should I actually write?

<!-- @answer -->
The two-pointer version, unless you have a specific reason not to. Most palindrome checks are validating input that is usually not a palindrome, which is where the early exit is worth 169x, and it allocates nothing. If you know the inputs are usually palindromes and the comparison is a plain byte compare, the copying form wins by 4.55x. And if you need to ignore case and punctuation — which is what real palindrome questions ask — the argument disappears entirely, because a cleaned copy cannot be vectorised: measured at n = 12,000 the in-place form won both cases, by 1.92x on a palindrome and 7,455x on a non-palindrome. In C++ std::equal against a reverse iterator gives you the two-pointer behaviour in one line with no allocation.

<!-- @doubt -->
### Does && versus an explicit if make any difference?

<!-- @answer -->
None. Writing return s[l] == s[r] && isPalindrome(s, l+1, r-1) relies on && short-circuiting to avoid the recursive call when the characters differ, and writing the mismatch as an explicit early return does the same thing by hand. Both compile to nineteen instructions with zero self-calls at -O1, and to twenty at -O2. Choose on readability. The explicit form makes the early exit visible as a statement, which is worth something in a subtopic whose whole point is that the early exit dominates the cost.

<!-- @doubt -->
### How deep does this go?

<!-- @answer -->
The same depth as Reverse an array, for the same reason. Two indices move toward each other, so it is one frame per two characters, and at -O0 the longest all-identical string it can check is 348,510 — 174,255 frames of 48 bytes each. But that only applies to inputs with no mismatch, which is to say to actual palindromes; anything else returns long before depth matters. At -O2 the tail call is eliminated and it completed 199,999,237. Python is the tighter case, where the default recursion limit of 1,000 caps it at about 1,997 characters.

<!-- @doubt -->
### Why does the frame not do anything on the way out?

<!-- @answer -->
Because the answer is already final by the time it comes back. Sum of First N Numbers added n to whatever the call below returned, so every frame did work during the unwind. Here a frame either returns false immediately, or it returns exactly what the frame below it returned, unchanged. That is what makes it a tail call, and it is why the compiler can drop the frames entirely at -O1. It also means the recursion is doing nothing a loop does not — the value that comes back up the chain is the same value the deepest frame produced.

<!-- @doubt -->
### What is the fastest way in Python?

<!-- @answer -->
It depends on the answer you expect, more sharply than in C++. At n = 1,500, s == s[::-1] measured 795.9ns on a random string and 792.4ns on a palindrome — flat, because it always does the same work. The two-pointer loop measured 82.2ns on random input, 9.7x faster, and 35,578.3ns on a palindrome, 45x slower. The recursion is worse than the loop in both cases and spans 735x from input alone, 87.5ns to 64,350.2ns. For most code s == s[::-1] is the right default: it is one line, its worst case is its only case, and the interpreted loop is only ahead when the answer is usually false.

<!-- @doubt -->
### How do I handle case and punctuation?

<!-- @answer -->
Skip and fold as you go, rather than building a cleaned string first. Advance each index past anything that is not alphanumeric, guarding both skip loops with l < r so a string of pure punctuation cannot run past the end, then compare the two characters case-insensitively. That keeps the early exit and allocates nothing — measured at n = 12,000 it beat the cleaned-copy approach 20,954.9ns to 40,132.5ns on a palindrome and 5.1ns to 38,023.6ns on a non-palindrome. One C++ detail matters: cast to unsigned char before calling isalnum or tolower, because passing a negative char to them is undefined behaviour.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Fibonacci, which makes the change this topic has been building toward: a frame that calls itself twice instead of once. Everything so far has produced a chain — one frame per level, a fixed amount of work in each, and a depth you could predict from n. Two calls per frame produce a tree instead, so the number of frames stops being proportional to n and starts growing exponentially, and the same naive translation of a definition that has worked in every subtopic up to now becomes unusable at surprisingly small inputs. It is the first time the recursion itself, rather than the type or the stack or the input, is the thing that has to be fixed.
