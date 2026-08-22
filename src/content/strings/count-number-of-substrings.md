---
id: count-number-of-substrings
topic: Strings
title: Count Number of Substrings
difficulty: Easy
status: ready
prerequisites:
  - for-loop
  - nested-loops
  - longest-subarray-with-given-sum-k-positives
  - check-if-two-strings-are-anagram-of-each-other
  - integer-overflow-and-precision-errors
  - time-and-space-complexity-basics
relatedIds:
  - longest-subarray-with-given-sum-k-positives
  - count-subarrays-with-given-sum
  - longest-subarray-with-sum-k
  - sort-characters-by-frequency
  - check-if-two-strings-are-anagram-of-each-other
---

<!-- @summary -->
Count the substrings containing exactly K distinct characters — where "exactly K" has no direct sliding window but **atMost(K) minus atMost(K-1)** does, verified over 49,205 exhaustive cases; where the brute force's early break is **silently disabled whenever the alphabet is no larger than K**, making it examine 100.0% of all 200,010,000 substrings on a binary string against 0.0% on a 26-letter one — measured 1,130x in C++ and 1,077x in Python; and where the answer overflows a 32-bit int from n = 65,536.

<!-- @theory -->
## The problem

Given a string and an integer `K`, count the substrings that contain **exactly**
`K` distinct characters.

```
s = "aba", K = 2   ->  3     "ab", "ba", "aba"
s = "abc", K = 1   ->  3     "a", "b", "c"
s = "aaa", K = 1   ->  6     "a" x3, "aa" x2, "aaa"
s = "aaa", K = 2   ->  0
```

A string of length `n` has `n(n+1)/2` substrings. That number is the ceiling on
the answer and the floor on what a brute force might examine, and it grows
quadratically — which is where both of this problem's traps come from.

## "Exactly K" has no sliding window. "At most K" does.

A sliding window needs a **monotone** predicate: if a window satisfies it,
shrinking the window must keep satisfying it. That is what lets you move the left
pointer forward and never back.

"At most K distinct" is monotone — remove a character from a window and the
distinct count cannot rise. So the window works, and counting is easy: for each
right end, every left position from `left` to `right` gives a valid substring, so
add `right - left + 1`.

"Exactly K distinct" is **not** monotone. A window with exactly K distinct can
shrink to K-1 and then never recover. There is no single window to maintain.

The way out is subtraction:

```
exactly(K)  =  atMost(K)  -  atMost(K-1)
```

Every substring with at most K distinct characters has either exactly K or at
most K-1, and those two sets are disjoint and cover it. So the difference is
exactly what is wanted.

Verified rather than argued: over every string up to length 8 on a three-letter
alphabet, for K from 0 to 4 — **49,205 (string, K) pairs — zero mismatches**
against a brute-force count.

This identity is the transferable part. It converts any "exactly" counting
problem into two "at most" problems, and "at most" is almost always the one with
a window.

## The brute force is fine — until the alphabet is small

The obvious approach fixes a left end, extends right, and breaks as soon as the
distinct count exceeds K. That break is what makes it look acceptable, and it is
conditional in a way the code does not reveal.

**If the alphabet has more than K symbols**, a random string accumulates K+1
distinct characters within a few positions, so the break fires almost immediately
and each left end does O(1) work.

**If the alphabet has K or fewer symbols**, the distinct count can never exceed
K, so the break **never fires** and every one of the `n(n+1)/2` substrings is
examined.

Measured at n = 20,000 with K = 3, counting the actual inner iterations:

| Alphabet | Brute force | Inner steps | Share of all 200,010,000 substrings |
|---|---|---|---|
| **2** | **329,807.3us** | 200,010,000 | **100.0%** |
| **3** | **205,382.0us** | 200,010,000 | **100.0%** |
| 4 | 577.8us | 168,599 | 0.1% |
| 6 | 469.1us | 113,847 | 0.1% |
| 8 | 412.5us | 102,100 | 0.1% |
| 26 | **291.9us** | 85,192 | **0.0%** |

The cliff is exactly at `alphabet = K + 1`. Below it the function is quadratic;
at or above it, near linear. Same code, same `n`, **1,130x** apart — and a binary
string is the most ordinary input imaginable.

Python shows the same cliff more sharply, because its constant factor is larger:

| n | Alphabet | Brute force | Two-pass window | Ratio |
|---|---|---|---|---|
| 1,000 | 2 | 37,283.4us | 170.9us | **218x** |
| 1,000 | 26 | 519.6us | 383.1us | 1x |
| 5,000 | 2 | **1,006,424.3us** | 934.1us | **1,077x** |
| 5,000 | 26 | 2,596.3us | 2,244.8us | 1x |
| 20,000 | 26 | 10,395.8us | 7,872.2us | 1x |

Read the 26-letter rows honestly: at that alphabet the brute force is **barely
worse than the window**, within about 20%. That is precisely what makes it
dangerous. It passes on the inputs people test with and takes a second on a
binary string of 5,000 characters.

## The window's inner loop is not a nested loop

The shrink step is written as a `while` inside the `for`, which reads like O(n^2).
It is not: `left` only ever moves forward and never passes `right`, so across the
entire scan both pointers together move at most `2n` times.

Measured, counting every pointer movement:

| n | Alphabet | K | Right moves | Left moves | Total | Share of n(n+1)/2 |
|---|---|---|---|---|---|---|
| 1,000 | 26 | 3 | 1,000 | 996 | 1,996 | 0.3988% |
| 10,000 | 26 | 3 | 10,000 | 9,996 | 19,996 | 0.0400% |
| 10,000 | 26 | 12 | 10,000 | 9,985 | 19,985 | 0.0400% |
| 100,000 | 26 | 3 | 100,000 | 99,996 | **199,996** | **0.0040%** |
| 10,000 | **2** | 3 | 10,000 | **0** | 10,000 | 0.0200% |

Note the last row. On a binary string with K = 3 the window never has more than
two distinct characters, so **the left pointer never moves at all** — and that is
the exact input on which the brute force examines all 200 million substrings. The
input that is worst for one is best for the other.

## The answer overflows a 32-bit int at n = 65,536

The count can be as large as `n(n+1)/2`, and that crosses `INT_MAX` sooner than
people expect:

| n | n(n+1)/2 | 32-bit accumulator returns |
|---|---|---|
| 65,535 | 2,147,450,880 | 2,147,450,880 |
| **65,536** | **2,147,516,416** | **-2,147,450,880** |
| 70,000 | 2,450,035,000 | -1,844,932,296 |
| **100,000** | **5,000,050,000** | **705,082,704** |

The 100,000 row is the dangerous one. At 65,536 the result goes negative and any
sanity check catches it. At 100,000 it wraps to a **plausible positive number** —
705 million, where the truth is 5 billion — and nothing looks wrong. Accumulate
into a 64-bit integer.

## Two passes or one

`atMost(K) - atMost(K-1)` is two independent scans. Both windows can be advanced
in the same loop instead, tracking two left pointers and adding their difference.
Measured at alphabet 26, K = 3:

| n | Two passes | One pass | Ratio |
|---|---|---|---|
| 100 | 0.54us | 0.35us | 1.5x |
| 1,000 | 2.36us | 1.83us | 1.3x |
| 10,000 | 24.59us | 19.03us | 1.3x |
| 100,000 | 458.90us | 293.17us | **1.6x** |

A consistent 1.3-1.6x for roughly twice the state to keep straight. Worth it in a
hot path; the two-pass version is what to write first, because each half is
independently testable and the subtraction is the only thing joining them.

One warning the fused version carries and the two-pass one does not: its second
window shrinks while `distinct >= K`, which for `K = 0` never terminates and walks
off the end of the string. Guard `K <= 0` explicitly — this is a segfault, not a
wrong answer.

## The window cost varies with K, and never approaches quadratic

Measured at n = 20,000, alphabet 26, median of three runs:

| K | Two-pass window |
|---|---|
| 1 | 51.53us |
| 3 | 63.14us |
| 6 | 113.12us |
| 12 | 245.85us |
| 20 | 165.36us |

It is not flat, and it is not monotone — the peak is in the middle, where windows
are large enough to hold many characters but still shrink often. The total
pointer movement stays bounded by 2n throughout; what varies is how much
bookkeeping each move does. Across the whole range it stays within 5x of itself,
while the brute force spans 1,130x on the same input size.

<!-- @intuition -->
The blocker here is that the natural predicate is the one the technique cannot use. Sliding windows need a property that survives shrinking, and "exactly K distinct" does not — take a character away and you have K-1, with no way back. The move is to stop trying to count the thing you want directly and count two things you can, then subtract: every substring with at most K distinct characters has either exactly K or at most K-1, so the difference is precisely the target. That reframing is worth more than the problem, because "exactly" almost never has a window and "at most" almost always does. The second idea is about where a brute force's cost really lives. The early break makes the naive loop look linear, but whether it ever fires depends on the alphabet rather than on the input length — with three symbols and K of three, the distinct count can never exceed three, so the break is dead code and every one of the two hundred million substrings gets visited. The same function, at the same size, spans three orders of magnitude depending on a property of the data that the complexity analysis never mentions.

<!-- @approach -->
### Every Substring, With an Early Break

<!-- @idea -->
Fix each left end, extend to the right while tracking distinct characters, and stop as soon as the count exceeds K.

<!-- @steps -->
1. Set the running total to zero.
2. For each starting index, clear a character count table and a distinct counter.
3. Extend the right end one character at a time, updating the table.
4. Increase the distinct counter when a character is seen for the first time in this window.
5. Add one to the total whenever the distinct count equals K exactly.
6. Break out of the inner loop as soon as the distinct count exceeds K.
7. Return the total.

<!-- @complexity -->
- time: O(n^2) when the alphabet has K or fewer symbols, and close to O(n) when it has more — the early break is what decides, and it depends on the data rather than the size
- space: O(1) for a fixed table, cleared once per starting index
- note: The approach whose cost is invisible from its code. At n = 20,000 with K = 3 it measured 291.9 microseconds on a 26-letter alphabet and **329,807.3 on a binary one** — 1,130x, from the same function on the same length. Counting inner iterations shows why: 85,192 of the 200,010,000 possible substrings on 26 letters (0.0%), and all 200,010,000 on two letters (100.0%), because the distinct count can never exceed K so the break never fires.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

long long countSubstrings(const string& s, int k) {
    long long res = 0;
    int n = s.size();
    for (int i = 0; i < n; i++) {
        int count[256] = {0}, distinct = 0;
        for (int j = i; j < n; j++) {
            if (count[(unsigned char)s[j]]++ == 0) distinct++;
            if (distinct == k) res++;
            else if (distinct > k) break;
        }
    }
    return res;
}
```

<!-- @annotations -->
- 5: `long long`, not `int`. The answer reaches n(n+1)/2, which passes INT_MAX at n = 65,536 and wraps to a plausible positive number at n = 100,000.
- 12: The break that the whole cost depends on. When the alphabet has K or fewer symbols `distinct` can never exceed `k`, so this line never executes and the loop is fully quadratic.
- 8: Clearing a 256-entry table once per starting index is 256n writes on its own — worth knowing, though it is dwarfed by the scan when the break fails.

<!-- @code java -->
```java
static long countSubstrings(String s, int k) {
    long res = 0;
    int n = s.length();
    for (int i = 0; i < n; i++) {
        int[] count = new int[256];
        int distinct = 0;
        for (int j = i; j < n; j++) {
            if (count[s.charAt(j)]++ == 0) distinct++;
            if (distinct == k) res++;
            else if (distinct > k) break;
        }
    }
    return res;
}
```

<!-- @annotations -->
- 5: A fresh array per starting index means n allocations. Reusing one array and clearing only the entries touched is the usual fix, and it matters most on exactly the inputs where the break fails.

<!-- @code python -->
```python
def count_substrings(s, k):
    n = len(s)
    res = 0
    for i in range(n):
        count = {}
        distinct = 0
        for j in range(i, n):
            ch = s[j]
            if ch not in count:
                count[ch] = 0
                distinct += 1
            count[ch] += 1
            if distinct == k:
                res += 1
            elif distinct > k:
                break
    return res


# 519.6us at n = 1,000 on 26 letters and 37,283.4us on two letters --
# and at n = 5,000, 2,596.3us against 1,006,424.3. Same code, same
# length, 1,077x apart.
```

<!-- @annotations -->
- 13: On a 26-letter alphabet this fires within a few characters, which is why the brute force is only about 20% behind the window there — and why it passes the tests people write.

<!-- @approach -->
### Optimal - atMost(K) minus atMost(K-1)

<!-- @idea -->
"Exactly K" has no sliding window, but "at most K" does — so count at most K, count at most K-1, and subtract.

<!-- @steps -->
1. Write a helper that counts substrings with at most K distinct characters.
2. In the helper, extend the right end one character at a time, updating a count table.
3. While the distinct count exceeds K, remove the leftmost character and advance the left pointer.
4. Add `right - left + 1` to the total, since every left position in the window gives a valid substring.
5. Return the helper's result for K minus its result for K-1.

<!-- @complexity -->
- time: O(n) — two passes, and within each pass both pointers together move at most 2n times
- space: O(1) for a fixed-size table
- note: The one to write. The identity is exact — verified over 49,205 (string, K) pairs with zero mismatches — and each half is independently testable, which the fused version below gives up. Measured 458.90 microseconds at n = 100,000, against 1,412.8 for the brute force on the same 26-letter input and against a full second for the brute force on a binary string a twentieth of the size.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

static long long atMost(const string& s, int k) {
    if (k < 0) return 0;
    long long res = 0;
    int count[256] = {0}, distinct = 0, left = 0, n = s.size();
    for (int right = 0; right < n; right++) {
        if (count[(unsigned char)s[right]]++ == 0) distinct++;
        while (distinct > k) {
            if (--count[(unsigned char)s[left]] == 0) distinct--;
            left++;
        }
        res += right - left + 1;
    }
    return res;
}

long long countSubstrings(const string& s, int k) {
    return atMost(s, k) - atMost(s, k - 1);
}
```

<!-- @annotations -->
- 5: `k < 0` returns 0, which is what makes the call with `k - 1` safe when K is 0. Without it the shrink loop below never terminates.
- 11: This looks like a nested loop and is not — `left` only moves forward and never passes `right`, so both pointers together move at most 2n times over the whole scan. Measured 199,996 moves at n = 100,000.
- 14: Every left position from `left` to `right` ends a valid substring at `right`, so one addition covers them all rather than a loop.

<!-- @code java -->
```java
static long atMost(String s, int k) {
    if (k < 0) return 0;
    long res = 0;
    int[] count = new int[256];
    int distinct = 0, left = 0, n = s.length();
    for (int right = 0; right < n; right++) {
        if (count[s.charAt(right)]++ == 0) distinct++;
        while (distinct > k) {
            if (--count[s.charAt(left)] == 0) distinct--;
            left++;
        }
        res += right - left + 1;
    }
    return res;
}

static long countSubstrings(String s, int k) {
    return atMost(s, k) - atMost(s, k - 1);
}
```

<!-- @annotations -->
- 12: `res` is a `long` and `right - left + 1` is an `int`; the addition widens correctly here, but writing `res += (long)(right - left + 1)` makes the intent explicit if the expression ever grows.

<!-- @code python -->
```python
def at_most(s, k):
    if k < 0:
        return 0
    count = {}
    left = 0
    res = 0
    for right, ch in enumerate(s):
        count[ch] = count.get(ch, 0) + 1
        while len(count) > k:
            l = s[left]
            count[l] -= 1
            if count[l] == 0:
                del count[l]
            left += 1
        res += right - left + 1
    return res


def count_substrings(s, k):
    return at_most(s, k) - at_most(s, k - 1)


# Python integers do not overflow, so the 32-bit trap in the C++ and
# Java versions simply does not exist here.
```

<!-- @annotations -->
- 13: Deleting the key when the count hits zero is what makes `len(count)` the distinct count. Leaving zero entries in the dict silently breaks the window condition.
- 9: `len(count)` is O(1) in CPython, so testing it every iteration costs nothing.

<!-- @approach -->
### One Pass, Two Windows

<!-- @idea -->
Advance both windows in the same loop and add the gap between their left pointers.

<!-- @steps -->
1. Return zero immediately if K is not positive.
2. Keep two windows over the same string, each with its own table and left pointer.
3. Shrink the first while it holds more than K distinct characters.
4. Shrink the second while it holds K or more distinct characters.
5. Add the difference between the two left pointers to the total.
6. Return the total after one pass.

<!-- @complexity -->
- time: O(n) in a single pass, with three pointers each moving at most n times
- space: O(1) — two fixed tables
- note: The same answer as the subtraction, fused. Measured 293.17 microseconds at n = 100,000 against 458.90 for two passes — a consistent 1.3x to 1.6x for about twice the state. The reason to write the two-pass version first is testability: each `atMost` call is independently checkable, and the only thing joining them is a minus sign. The K guard on the first line is not defensive style — the second shrink loop runs while `distinct >= k`, which for K = 0 never stops and reads past the end of the string.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

long long countSubstrings(const string& s, int k) {
    if (k <= 0) return 0;
    long long res = 0;
    int big[256] = {0}, small[256] = {0};
    int dBig = 0, dSmall = 0, lBig = 0, lSmall = 0, n = s.size();
    for (int right = 0; right < n; right++) {
        unsigned char c = s[right];
        if (big[c]++ == 0) dBig++;
        if (small[c]++ == 0) dSmall++;
        while (dBig > k) { if (--big[(unsigned char)s[lBig]] == 0) dBig--; lBig++; }
        while (dSmall >= k) { if (--small[(unsigned char)s[lSmall]] == 0) dSmall--; lSmall++; }
        res += lSmall - lBig;
    }
    return res;
}
```

<!-- @annotations -->
- 5: Without this line the loop on line 13 runs while `dSmall >= 0`, which is always true, and `lSmall` walks past the end of the string. That is a crash, not a wrong answer.
- 13: `>=` here against `>` on the line above — that one character is the whole difference between the two windows, and it is the easiest thing on the page to get backwards.
- 15: `lSmall - lBig` is the count of left positions giving exactly K distinct characters ending at `right`.

<!-- @code java -->
```java
static long countSubstrings(String s, int k) {
    if (k <= 0) return 0;
    long res = 0;
    int[] big = new int[256], small = new int[256];
    int dBig = 0, dSmall = 0, lBig = 0, lSmall = 0, n = s.length();
    for (int right = 0; right < n; right++) {
        char c = s.charAt(right);
        if (big[c]++ == 0) dBig++;
        if (small[c]++ == 0) dSmall++;
        while (dBig > k) { if (--big[s.charAt(lBig)] == 0) dBig--; lBig++; }
        while (dSmall >= k) { if (--small[s.charAt(lSmall)] == 0) dSmall--; lSmall++; }
        res += lSmall - lBig;
    }
    return res;
}
```

<!-- @annotations -->
- 4: Two 256-entry arrays rather than two hash maps. The keys are characters, so indexing is both simpler and faster than hashing.

<!-- @code python -->
```python
def count_substrings(s, k):
    if k <= 0:
        return 0
    big, small = {}, {}
    l_big = l_small = res = 0
    for right, ch in enumerate(s):
        big[ch] = big.get(ch, 0) + 1
        small[ch] = small.get(ch, 0) + 1
        while len(big) > k:
            c = s[l_big]
            big[c] -= 1
            if big[c] == 0:
                del big[c]
            l_big += 1
        while len(small) >= k:
            c = s[l_small]
            small[c] -= 1
            if small[c] == 0:
                del small[c]
            l_small += 1
        res += l_small - l_big
    return res


# 666.7us at n = 5,000 against 934.1 for two passes -- about 1.4x, for
# twice the bookkeeping.
```

<!-- @annotations -->
- 2: The guard matters more in Python than the speed does: without it the second loop runs forever rather than crashing, since a negative index wraps around instead of reading out of bounds.

<!-- @example -->

<!-- @input -->
s = "aba", K = 2

<!-- @output -->
3

<!-- @why -->
Small enough to enumerate by hand, and enough to show the subtraction identity producing the answer without ever isolating an "exactly K" window.

<!-- @walkthrough -->
1. The substrings are "a", "b", "a", "ab", "ba", "aba" — six in total, which is n(n+1)/2 for n = 3.
2. Their distinct counts are 1, 1, 1, 2, 2, 2.
3. Exactly two distinct appears three times: "ab", "ba", "aba".
4. By the identity, atMost(2) counts all six substrings, since none has more than two distinct characters.
5. atMost(1) counts the three single characters only.
6. Six minus three is three, which is the answer.
7. Neither window ever had to hold "exactly two" — the subtraction produced it.

<!-- @example -->

<!-- @input -->
A binary string of 20,000 characters with K = 3, against a 26-letter one

<!-- @output -->
329,807.3us and 291.9us from the same function — 1,130x

<!-- @why -->
Locates the brute force's real cost in a property of the data, not the input size, which is what makes it pass testing and fail in production.

<!-- @walkthrough -->
1. Both inputs are 20,000 characters, so n(n+1)/2 is 200,010,000 substrings either way.
2. On 26 letters, a window accumulates four distinct characters within a few positions, so the break fires almost immediately.
3. Counting inner iterations gives 85,192 — 0.0% of all substrings.
4. On two letters, the distinct count can never exceed two, and K is three.
5. So `distinct > k` is never true, the break is dead code, and every substring is examined.
6. Counting inner iterations gives 200,010,000 — 100.0%.
7. The cliff is exactly at `alphabet = K + 1`: three letters is still 100.0%, four letters drops to 0.1%.
8. Nothing in the source distinguishes the two cases.

<!-- @example -->

<!-- @input -->
A string of 100,000 identical characters, K = 1, counted into a 32-bit int

<!-- @output -->
705,082,704 — where the correct answer is 5,000,050,000

<!-- @why -->
The overflow that produces a plausible answer rather than an obviously broken one, which is the harder failure to notice.

<!-- @walkthrough -->
1. Every substring of a one-character string has exactly one distinct character, so the answer is all of them.
2. That is n(n+1)/2, which for n = 100,000 is 5,000,050,000.
3. INT_MAX is 2,147,483,647, so the true answer needs 33 bits.
4. At n = 65,535 the count is 2,147,450,880 and still fits.
5. At n = 65,536 it is 2,147,516,416, and a 32-bit accumulator returns -2,147,450,880 — negative, so any sanity check catches it.
6. At n = 100,000 it wraps twice and returns 705,082,704, a perfectly plausible positive number.
7. Nothing in the output signals the error; only a 64-bit accumulator avoids it.

<!-- @example -->

<!-- @input -->
The pointer movements of the window at n = 100,000, alphabet 26, K = 3

<!-- @output -->
199,996 total moves against 5,000,050,000 substrings — 0.0040%

<!-- @why -->
Settles the most common objection to sliding windows, which is that the inner `while` makes them quadratic.

<!-- @walkthrough -->
1. The right pointer advances exactly once per character, so 100,000 moves.
2. The left pointer moved 99,996 times over the whole scan.
3. That is because `left` only ever increases and never passes `right`, so it can move at most n times in total no matter how the `while` loop is entered.
4. Both pointers together are bounded by 2n, which is 200,000 here.
5. Against the 5,000,050,000 substrings the brute force could examine, that is 0.0040%.
6. Raising K from 3 to 12 changed the total from 19,996 to 19,985 at n = 10,000 — the bound does not depend on K.
7. On a binary string with K = 3 the left pointer moved zero times, since the window never exceeded two distinct characters.
8. That is the same input on which the brute force examines all 200,010,000 substrings.

<!-- @visualization pointer-scan -->

<!-- @description -->
Draw the string as a row of cells with two pointers beneath it and a live distinct-count readout. Run the at-most-K window first: the right pointer advances one cell at a time, the readout ticks up as new characters enter, and whenever it exceeds K the left pointer walks forward until it drops back — with a running total gaining `right - left + 1` at each step, shown as a bracket spanning the current window so the addition is visibly a whole range rather than one substring. Keep two counters pinned throughout: right moves and left moves, both climbing towards n and never past it, with a caption that this is why the inner while-loop is not a nested loop. Then the identity, which deserves the centre of the figure: run the same animation twice side by side, once for K and once for K-1, and draw the two totals as bars — then subtract them physically, sliding the shorter bar out of the longer one and labelling the remainder exactly K. The point to land is that no window ever held "exactly K"; the answer came from the gap. Next, the brute force, drawn as a triangle of all n(n+1)/2 substrings with the examined ones shaded. On a 26-letter alphabet shade a thin sliver along the diagonal — 85,192 of 200,010,000, 0.0% — and let the early break visibly fire a few cells in on each row. Then switch the alphabet to two symbols and watch the entire triangle fill solid, 200,010,000 at 100.0%, with the break marker greyed out and struck through, labelled distinct can never exceed K, so this line never runs. Hold both triangles side by side with their timings, 291.9us and 329,807.3us. Close on the overflow: a counter climbing through 2,147,450,880 at n = 65,535, flipping to -2,147,450,880 one character later, and then at n = 100,000 landing on 705,082,704 in black rather than red, beside the true 5,000,050,000 — captioned this one does not look wrong.

<!-- @sampleInput -->
```json
{"primary":{"s":"aba","k":2,"answer":3,"substrings":["ab","ba","aba"],"allSubstrings":["a","b","a","ab","ba","aba"],"distinctCounts":[1,1,1,2,2,2],"viaIdentity":{"atMost2":6,"atMost1":3,"difference":3}},"smallCases":[{"s":"aba","k":2,"answer":3},{"s":"abc","k":1,"answer":3},{"s":"aaa","k":1,"answer":6},{"s":"aaa","k":2,"answer":0},{"s":"abc","k":0,"answer":0},{"s":"abc","k":4,"answer":0},{"s":"","k":1,"answer":0}],"totalSubstrings":{"formula":"n(n+1)/2","meaning":"the ceiling on the answer and the floor on what a brute force might examine"},"whyNoDirectWindow":{"requirement":"a sliding window needs a monotone predicate — if a window satisfies it, shrinking must keep satisfying it","atMostKIsMonotone":"removing a character cannot raise the distinct count","exactlyKIsNot":"a window with exactly K distinct can shrink to K-1 and never recover","consequence":"there is no single window to maintain for exactly K"},"identity":{"formula":"exactly(K) = atMost(K) - atMost(K-1)","why":"every substring with at most K distinct has either exactly K or at most K-1; the two sets are disjoint and cover it","verification":{"space":"all strings up to length 8 over {a,b,c}, K = 0..4","pairsChecked":49205,"mismatches":0},"transferable":"converts any exactly-counting problem into two at-most problems, and at-most is almost always the one with a window"},"bruteForceCliff":{"claim":"the early break is disabled whenever the alphabet has K or fewer symbols","cliffAt":"alphabet = K + 1","measuredAt":{"n":20000,"k":3,"totalSubstrings":200010000},"rows":[{"alphabet":2,"us":329807.3,"innerSteps":200010000,"share":"100.0%"},{"alphabet":3,"us":205382.0,"innerSteps":200010000,"share":"100.0%"},{"alphabet":4,"us":577.8,"innerSteps":168599,"share":"0.1%"},{"alphabet":6,"us":469.1,"innerSteps":113847,"share":"0.1%"},{"alphabet":8,"us":412.5,"innerSteps":102100,"share":"0.1%"},{"alphabet":26,"us":291.9,"innerSteps":85192,"share":"0.0%"}],"spread":"1130x from the same function on the same input length"},"amortization":{"claim":"the inner while-loop is not a nested loop — both pointers together move at most 2n times","rows":[{"n":1000,"alphabet":26,"k":3,"rightMoves":1000,"leftMoves":996,"total":1996,"shareOfAllSubstrings":"0.3988%"},{"n":10000,"alphabet":26,"k":3,"rightMoves":10000,"leftMoves":9996,"total":19996,"shareOfAllSubstrings":"0.0400%"},{"n":10000,"alphabet":26,"k":12,"rightMoves":10000,"leftMoves":9985,"total":19985,"shareOfAllSubstrings":"0.0400%"},{"n":100000,"alphabet":26,"k":3,"rightMoves":100000,"leftMoves":99996,"total":199996,"shareOfAllSubstrings":"0.0040%"},{"n":10000,"alphabet":2,"k":3,"rightMoves":10000,"leftMoves":0,"total":10000,"shareOfAllSubstrings":"0.0200%"}],"note":"on a binary string with K=3 the left pointer never moves at all — the exact input on which the brute force examines every substring"},"overflow":{"intMax":2147483647,"rows":[{"n":65535,"exact":2147450880,"intAccumulator":2147450880,"ok":true},{"n":65536,"exact":2147516416,"intAccumulator":-2147450880,"ok":false},{"n":70000,"exact":2450035000,"intAccumulator":-1844932296,"ok":false},{"n":100000,"exact":5000050000,"intAccumulator":705082704,"ok":false}],"reading":"at 65,536 it goes negative and any sanity check catches it; at 100,000 it wraps to a plausible positive number and nothing looks wrong","fix":"accumulate into a 64-bit integer; Python integers do not overflow"},"benchCpp":{"unit":"microseconds per run, Apple M2, clang -O2, alphabet 26, K = 3","rows":[{"n":100,"brute":3.4,"twoPass":0.54,"onePass":0.35},{"n":1000,"brute":18.3,"twoPass":2.36,"onePass":1.83},{"n":10000,"brute":142.3,"twoPass":24.59,"onePass":19.03},{"n":100000,"brute":1412.8,"twoPass":458.90,"onePass":293.17}],"onePassVsTwoPass":"1.3x to 1.6x, for about twice the state","windowCostAgainstK":{"n":20000,"alphabet":26,"medianOfThree":[{"k":1,"us":51.53},{"k":3,"us":63.14},{"k":6,"us":113.12},{"k":12,"us":245.85},{"k":20,"us":165.36}],"reading":"not flat and not monotone — the peak is in the middle, where windows are large but still shrink often; the spread stays within 5x while the brute force spans 1130x"}},"benchPython":{"unit":"microseconds per run, CPython 3.13.4, K = 3","rows":[{"n":1000,"alphabet":2,"brute":37283.4,"twoPass":170.9,"onePass":120.2,"ratio":"218x"},{"n":1000,"alphabet":26,"brute":519.6,"twoPass":383.1,"onePass":360.3,"ratio":"1x"},{"n":5000,"alphabet":2,"brute":1006424.3,"twoPass":934.1,"onePass":666.7,"ratio":"1077x"},{"n":5000,"alphabet":26,"brute":2596.3,"twoPass":2244.8,"onePass":1848.4,"ratio":"1x"},{"n":20000,"alphabet":26,"brute":10395.8,"twoPass":7872.2,"onePass":7397.7,"ratio":"1x"}],"honestReading":"on a 26-letter alphabet the brute force is within about 20% of the window — which is exactly what makes it dangerous, since it passes the tests people write and takes a second on a binary string of 5,000 characters"},"fusedVersionHazard":{"issue":"the second window shrinks while distinct >= K, which for K = 0 never terminates and walks off the end of the string","symptom":"segmentation fault in C++ and Java, infinite loop in Python","fix":"guard K <= 0 and return 0 before the loop","note":"the two-pass version does not have this hazard, because atMost(-1) returns 0 by its own guard"},"assertions":["the answer is between 0 and n(n+1)/2","the answer is 0 when K is 0, when K exceeds the number of distinct characters, or when the string is empty","atMost(K) is non-decreasing in K","exactly(K) summed over all K equals n(n+1)/2","both window pointers together move at most 2n times per pass"],"recommendation":"write atMost(K) - atMost(K-1) with a 64-bit accumulator; fuse the two windows only in a hot path, and guard K <= 0 when you do","lesson":"exactly has no window and at most does, so count two things you can and subtract — and check whether a brute force's early exit can actually fire before trusting it"}
```

<!-- @highlights -->
- The string is drawn as a row of cells with two pointers beneath it and a live distinct-count readout.
- The right pointer advances one cell at a time and the readout ticks up as new characters enter.
- Whenever the count exceeds K the left pointer walks forward until it drops back.
- A running total gains `right - left + 1` at each step, shown as a bracket spanning the window so the addition is visibly a whole range.
- Two counters stay pinned throughout — right moves and left moves — both climbing towards n and never past it.
- The caption explains that this is why the inner while-loop is not a nested loop.
- The centre runs the same animation twice side by side, once for K and once for K-1.
- The two totals are drawn as bars, then subtracted physically: the shorter slides out of the longer, and the remainder is labelled exactly K.
- The point lands that no window ever held "exactly K" — the answer came from the gap.
- The brute force is drawn as a triangle of all n(n+1)/2 substrings with the examined ones shaded.
- On 26 letters a thin sliver shades along the diagonal — 85,192 of 200,010,000, 0.0% — with the early break firing a few cells into each row.
- Switching the alphabet to two symbols fills the entire triangle solid, 200,010,000 at 100.0%.
- The break marker greys out, struck through, labelled distinct can never exceed K, so this line never runs.
- Both triangles hold side by side with their timings, 291.9us and 329,807.3us.
- The close is the overflow: a counter climbing through 2,147,450,880 at n = 65,535 and flipping to -2,147,450,880 one character later.
- At n = 100,000 it lands on 705,082,704 in black rather than red, beside the true 5,000,050,000, captioned this one does not look wrong.

<!-- @edgeCases -->
- K equal to zero — the answer is 0, and the fused one-pass version crashes or loops forever without an explicit guard.
- K larger than the number of distinct characters — the answer is 0, and `atMost(K)` equals `atMost(K-1)` so the subtraction gives zero naturally.
- The empty string — the answer is 0; both loops simply never run.
- K equal to 1 on a one-character string — the answer is n(n+1)/2, the maximum possible, and the case that overflows first.
- A string of 65,536 identical characters with K = 1 — the smallest input whose answer exceeds INT_MAX.
- A string of 100,000 identical characters — the answer wraps to a plausible positive number in 32 bits rather than an obviously wrong negative one.
- An alphabet no larger than K — the brute force's break never fires and it examines every substring; a binary string with K = 3 is enough.
- An alphabet exactly K+1 — the cliff edge, where the break starts firing and the cost drops from 100.0% to 0.1% of all substrings.
- All characters distinct — every window is shrunk aggressively, so the left pointer moves nearly as often as the right.
- Bytes above 127 with a signed `char` index — negative subscript into the count table, the same hazard as every other counting problem here.

<!-- @pitfalls -->
- Accumulating into a 32-bit int. The answer reaches n(n+1)/2, which passes INT_MAX at n = 65,536 and wraps to a plausible 705,082,704 at n = 100,000 where the truth is 5,000,050,000.
- Trying to slide a window for "exactly K" directly. The predicate is not monotone — a window can shrink from K distinct to K-1 and never recover — so there is no single window to maintain.
- Trusting the brute force's early break. It never fires when the alphabet has K or fewer symbols, which makes the same function 1,130x slower on a binary string than on a 26-letter one at the same length.
- Benchmarking only on large alphabets. At 26 letters the brute force is within about 20% of the window, so it passes exactly the tests that would have caught it.
- Reading the window's inner `while` as a nested loop. Both pointers together move at most 2n times per pass — measured 199,996 at n = 100,000, or 0.0040% of the substrings.
- Forgetting to delete zero-count keys from a Python dict. `len(count)` is the distinct count only if absent characters are absent, not present with value zero.
- Omitting the `k < 0` guard in `atMost`. The call with `k - 1` when K is 0 otherwise enters a shrink loop that never terminates.
- Omitting the `k <= 0` guard in the fused one-pass version. Its second loop runs while `distinct >= k`, which for K = 0 walks the left pointer past the end of the string — a crash, not a wrong answer.
- Writing `>` where the fused version needs `>=`. The two shrink conditions differ by one character and produce a silently wrong count.
- Allocating a fresh 256-entry table per starting index in the brute force. That is n allocations and 256n writes before any real work.

<!-- @doubt -->
### Why can I not just slide a window for exactly K distinct characters?

<!-- @answer -->
Because a sliding window needs the predicate to survive shrinking, and "exactly K" does not. The technique works by advancing the right end and, when the window becomes invalid, advancing the left end until it is valid again — which is only sound if removing characters moves you *towards* validity. "At most K distinct" has that property: taking a character out can never raise the distinct count. "Exactly K distinct" does not: shrink a window holding exactly K and you get K-1, and shrinking further will never bring it back. So there is no invariant to maintain. The fix is `exactly(K) = atMost(K) - atMost(K-1)` — every substring with at most K distinct characters has either exactly K or at most K-1, the two sets are disjoint and cover it, so the difference is the answer. Verified over 49,205 (string, K) pairs with zero mismatches.

<!-- @doubt -->
### The inner `while` is inside a `for`. Is that not O(n^2)?

<!-- @answer -->
No, and this is the standard misreading of sliding windows. The left pointer only ever moves forward and never passes the right pointer, so across the entire scan it can move at most n times in total — regardless of how many iterations of the outer loop enter the `while`. Some iterations run it many times and most run it zero times, and the total is bounded. Measured at n = 100,000 on a 26-letter alphabet with K = 3: the right pointer moved 100,000 times and the left pointer 99,996, for 199,996 in total against the 5,000,050,000 substrings that exist — 0.0040%. Raising K from 3 to 12 left the total essentially unchanged, at 19,985 against 19,996 for n = 10,000, because the bound does not depend on K.

<!-- @doubt -->
### My brute force passes all the tests. Why should I not use it?

<!-- @answer -->
Because whether it is fast depends on your alphabet, and the tests people write use large ones. The early break fires when the distinct count exceeds K — but if the alphabet has K or fewer symbols, the distinct count *cannot* exceed K, so the break is dead code and every one of the n(n+1)/2 substrings gets examined. Measured at n = 20,000 with K = 3: on 26 letters it examined 85,192 substrings (0.0% of the total) and took 291.9 microseconds; on two letters it examined all 200,010,000 (100.0%) and took **329,807.3** — a factor of 1,130 from the same function on the same length. In Python the same comparison at n = 5,000 was 2,596.3 microseconds against 1,006,424.3, or 1,077x. And on 26 letters the brute force is within about 20% of the window, which is why testing there tells you nothing.

<!-- @doubt -->
### Where exactly does the answer overflow?

<!-- @answer -->
At n = 65,536, and the more dangerous failure is later. The maximum possible answer is n(n+1)/2, reached when K = 1 and every character is identical. INT_MAX is 2,147,483,647; n = 65,535 gives 2,147,450,880, which fits, and n = 65,536 gives 2,147,516,416, which does not. A 32-bit accumulator returns **-2,147,450,880** there — negative, so it is obvious. But at n = 100,000 the true answer is 5,000,050,000 and the 32-bit result is **705,082,704**: a plausible positive number, with nothing to signal that it is wrong. Use a 64-bit accumulator. Python's integers are arbitrary precision, so the trap does not exist there at all.

<!-- @doubt -->
### Should I fuse the two passes into one?

<!-- @answer -->
Only in a hot path, and write the two-pass version first. Measured at alphabet 26 with K = 3, the fused version was 293.17 microseconds against 458.90 at n = 100,000 — a consistent 1.3x to 1.6x across sizes — for about twice the state to keep straight. The two-pass version's real advantage is that each `atMost` call is independently testable and the only thing joining them is a minus sign, whereas the fused version has two shrink conditions that differ by a single character (`> k` against `>= k`) and are easy to swap silently. It also carries a hazard the two-pass version does not: its second loop runs while `distinct >= k`, which for K = 0 never terminates and reads past the end of the string. Guard `k <= 0` explicitly.

<!-- @doubt -->
### Does the window get slower as K grows?

<!-- @answer -->
It varies, but not in the way the brute force does, and never towards quadratic. Measured at n = 20,000 on a 26-letter alphabet, median of three runs: 51.53 microseconds at K = 1, 63.14 at K = 3, 113.12 at K = 6, 245.85 at K = 12 and 165.36 at K = 20. Not flat and not monotone — the peak is in the middle, where windows are large enough to hold many distinct characters but still shrink often, while at K = 20 on a 26-letter alphabet the window rarely needs shrinking at all. The total pointer movement stays bounded by 2n throughout; what changes is how much bookkeeping each move does. Across the whole range it stays within 5x of itself, where the brute force spans 1,130x on the same input size.

<!-- @doubt -->
### What should `atMost` return for a negative K?

<!-- @answer -->
Zero, and the guard is load-bearing rather than defensive. The whole approach calls `atMost(k - 1)`, so when K is 0 that call receives -1. Without an early return, the shrink loop condition `distinct > k` is true whenever the window is non-empty and stays true after every removal, so the left pointer advances past the right and off the end of the string. Returning 0 for any negative K is also the correct answer on its own terms — no substring contains a negative number of distinct characters — so the guard is not a special case bolted on, it is the function's value at that input. This is the same reason the fused one-pass version needs its own `k <= 0` check, since it has no `atMost` to inherit the guard from.

<!-- @doubt -->
### Is this identity useful outside this problem?

<!-- @answer -->
It is the main thing to take from it. "Exactly K" is rarely slideable and "at most K" almost always is, so the subtraction converts a hard counting problem into two easy ones, and the pattern recurs across the whole family: subarrays with exactly K distinct integers, subarrays with exactly K odd numbers, substrings with exactly K vowels. The requirement is that the "at most" predicate is monotone under shrinking, which is what makes the window legal, and that the two sets partition cleanly so the difference is exact. **Count subarrays with given sum** uses the same instinct in a different costume — count something cumulative you can maintain, then recover the target by a difference — and the shared habit is to stop trying to count the answer directly and find a quantity that a single pass can carry.
