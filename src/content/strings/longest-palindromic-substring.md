---
id: longest-palindromic-substring
topic: Strings
title: Longest Palindromic Substring
difficulty: Medium
status: ready
prerequisites:
  - for-loop
  - nested-loops
  - palindrome-number
  - reverse-words-in-a-given-string-palindrome-check
  - count-number-of-substrings
  - time-and-space-complexity-basics
relatedIds:
  - reverse-words-in-a-given-string-palindrome-check
  - palindrome-number
  - count-number-of-substrings
  - sum-of-beauty-of-all-substrings
  - longest-common-prefix
---

<!-- @summary -->
Find the longest palindrome inside a string — where expanding around all 2n-1 centres is O(n^2) on paper and **measured 1.54n comparisons** on random input, so Manacher's linear guarantee is **3.4x slower and never crosses over** as n grows; where the same expansion is **1,463x slower** on a string of identical characters; and where a long answer is not what makes it slow — a 4,000-character input that is *entirely* a palindrome ran in 9.77us against 3,900 for one made of repeats.

<!-- @theory -->
## The problem

Return the longest substring of `s` that reads the same forwards and backwards.

```
"babad"   ->  "bab"   or "aba" — both are valid
"cbbd"    ->  "bb"
"a"       ->  "a"
"ac"      ->  "a"     or "c"
```

Note the "or". Over every binary string up to length 10, **19.3%** have more than
one distinct longest palindromic substring, so a test comparing against one
expected string rejects correct solutions on a fifth of inputs. Assert the
properties instead: the result is a palindrome, it occurs in the input, and its
length matches.

## Every palindrome has a centre

A palindrome of odd length has a middle character; one of even length has a
middle gap. So there are exactly **2n - 1** possible centres — `n` characters and
`n - 1` gaps — and every palindromic substring is the result of expanding
outward from exactly one of them.

```
b a b a d
^ ^ ^ ^ ^      5 character centres
 ^ ^ ^ ^       4 gap centres
```

Try all 2n - 1, expand each while the characters match, keep the longest. That is
the whole algorithm, in O(1) extra space.

The bound is O(n^2), because a single expansion can run to n/2 steps. What that
bound does not say is how far expansions run **in practice**, and that turns out
to decide everything.

## The expansions almost never run

Counting the character comparisons actually performed, at two sizes:

| Input shape | n = 2,000 | n = 8,000 | Comparisons ÷ 2n |
|---|---|---|---|
| Random, 26 letters | 6,154 | 24,627 | **1.54x** both |
| Random, 4 letters | 7,305 | 29,338 | **1.83x** both |
| Random, 2 letters | 9,908 | 39,802 | **2.49x** both |
| `"aabbaabb..."` | 506,000 | 8,024,000 | n²/8 |
| `"ababab..."` | 1,005,000 | 16,020,000 | n²/4 |
| All one character | 2,005,000 | 32,020,000 | **n²/2** |

On random input the work is **linear** — and the ratio is *identical* at both
sizes, which is what linear means. The alphabet sets the constant: 1.54n at 26
letters, 2.49n at 2. Each expansion dies after a couple of comparisons because
two randomly chosen characters usually differ.

On repetitive input every expansion runs to the boundary, and the count lands on
exactly n²/2, n²/4 or n²/8 depending on the period.

## A long answer is not what makes it slow

The obvious guess is that expansion is slow when the palindrome is long. It is
not. Take a 4,000-character string that is **entirely** a palindrome — a random
26-letter half, mirrored:

| Input, n = 4,000 | Answer length | Comparisons | Time |
|---|---|---|---|
| Random 26 letters | 5 | 12,295 | 13.04us |
| **Whole string is a palindrome** | **4,000** | **14,300** | **9.77us** |
| All one character | 4,000 | 8,010,000 | 3,900.62us |

Both of the last two have a 4,000-character answer, and one is **400x** slower.
The palindromic string has exactly **one** centre that expands far; every other
centre sits between two random characters and dies immediately. The repetitive
string has *every* centre expanding far.

So the cost is the sum of the palindromic radii at all centres, not the maximum.
That is the quantity the O(n^2) bound is standing in for, and on real text it is
small.

## Manacher's algorithm is linear and does not pay off

Manacher's computes the palindromic radius at every centre in O(n) total, by
reusing the radii already computed inside the rightmost known palindrome. It is a
genuine linear-time algorithm, and on ordinary input it loses:

| n, random 26 letters | Expand around centres | Manacher's | Ratio |
|---|---|---|---|
| 1,000 | 2.17us | 7.57us | 3.49x |
| 4,000 | 8.62us | 30.32us | 3.52x |
| 16,000 | 35.67us | 125.57us | 3.52x |
| 64,000 | 145.48us | 500.30us | 3.44x |
| **256,000** | **595.24us** | **1,997.60us** | **3.36x** |

**There is no crossover.** The ratio is flat from 1,000 to 256,000 characters,
because expand-around-centres is *already linear* on this input — Manacher's is
competing against O(n), not O(n^2), and it pays for a transformed string of
2n + 3 characters and a radius array it must fill completely.

Now the other column:

| n, all one character | Expand around centres | Manacher's | Ratio |
|---|---|---|---|
| 1,000 | 245.71us | 11.48us | 21x |
| 4,000 | 3,905.51us | 45.40us | 86x |
| 16,000 | 64,146.27us | 182.57us | 351x |
| **64,000** | **1,062,429.53us** | **726.43us** | **1,463x** |

A full second against 0.7 milliseconds. This is the whole case for Manacher's: not
that it is fast, but that it **cannot be made slow**.

The same shape holds in Python, with a smaller penalty: Manacher's is 1.3x to 1.5x
slower on random input and expand is **404x** slower on all-one-character at
n = 8,000.

## The DP table is never the answer

The other standard O(n^2) approach fills a table where `table[i][j]` says whether
`s[i..j]` is a palindrome, using the recurrence that `s[i..j]` is one when
`s[i] == s[j]` and `s[i+1..j-1]` already is.

| Input, n = 4,000 | Expand | DP table | Manacher's |
|---|---|---|---|
| Random 26 letters | **13.04us** | 7,704.51us | 29.96us |
| Random 2 letters | **16.32us** | 34,765.10us | 48.04us |
| All one character | 3,900.62us | 20,996.78us | **45.67us** |

**591x to 2,128x behind expansion** on the inputs where expansion is fast, and
still 460x behind Manacher's where it is not. It also uses O(n^2) memory — 16 MB
at n = 4,000 — where both other approaches use O(n) or less.

The DP table is worth understanding because the recurrence is the clearest
statement of what a palindrome *is*. It is not worth running: it does the full
quadratic work unconditionally, where expansion does it only when the input
forces it.

## What to write

**Expand around centres.** It is a dozen lines, needs no extra memory, and is the
fastest thing here on any input that is not highly repetitive — which is nearly
all real text. Its worst case is real, so if an adversary chooses your input, or
your data is DNA, binary, or long runs of one character, reach for Manacher's and
accept 3.4x on the ordinary case in exchange for never seeing a second.

<!-- @intuition -->
The move that unlocks this problem is realising you do not have to consider substrings at all. Every palindrome is symmetric about something — a character or a gap between two — so there are only 2n-1 things to try, and each is a single outward walk. That turns a search over O(n²) substrings into a scan over O(n) centres, and the only question left is how far each walk runs. The interesting part is that the answer is almost always "not far". Two randomly chosen characters usually differ, so nearly every expansion dies in a couple of comparisons and the total work comes out linear with a constant set by the alphabet size — measured 1.54n on 26 letters. The quadratic bound is real but it needs an input built from repeats to reach, and that is also the case people reach for Manacher's to solve. What makes the trade genuinely awkward is that there is no crossover to wait for: on ordinary input the linear-time algorithm stays a constant factor behind at every size, because it is competing against something that was already linear. You are not buying speed, you are buying the absence of a worst case.

<!-- @approach -->
### Every Substring, Checked

<!-- @idea -->
Generate all substrings, test each for being a palindrome, and keep the longest.

<!-- @steps -->
1. Consider every start index.
2. For each, consider every end index at or after it.
3. Check whether that substring reads the same in both directions.
4. Keep it if it is a palindrome and longer than the best so far.
5. Return the best after all substrings have been examined.

<!-- @complexity -->
- time: O(n^3) — n^2/2 substrings, each checked in up to O(n)
- space: O(n) for the candidate being tested
- note: The definition transcribed, and useful only as the reference implementation to check the others against — which is how the three approaches below were verified over all 1,023 binary strings up to length 9 and 20,000 random ones, with zero mismatches. At n = 4,000 it does not finish in reasonable time, where expansion takes 13 microseconds.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

bool isPal(const string& s, int i, int j) {
    while (i < j) {
        if (s[i] != s[j]) return false;
        i++; j--;
    }
    return true;
}

string longestPalindrome(const string& s) {
    int n = s.size(), lo = 0, len = n ? 1 : 0;
    for (int i = 0; i < n; i++)
        for (int j = i; j < n; j++)
            if (j - i + 1 > len && isPal(s, i, j)) { lo = i; len = j - i + 1; }
    return s.substr(lo, len);
}
```

<!-- @annotations -->
- 16: Testing the length **before** calling `isPal` skips every candidate that could not win, which is the only thing making this survivable on small inputs at all.
- 4: The palindrome check is itself the two-pointer scan from **Reverse words / Palindrome Check**, with no character filtering.

<!-- @code java -->
```java
static boolean isPal(String s, int i, int j) {
    while (i < j) {
        if (s.charAt(i) != s.charAt(j)) return false;
        i++; j--;
    }
    return true;
}

static String longestPalindrome(String s) {
    int n = s.length(), lo = 0, len = n > 0 ? 1 : 0;
    for (int i = 0; i < n; i++)
        for (int j = i; j < n; j++)
            if (j - i + 1 > len && isPal(s, i, j)) { lo = i; len = j - i + 1; }
    return s.substring(lo, lo + len);
}
```

<!-- @annotations -->
- 13: Indices rather than `substring` inside the loop — building a String per candidate would add an allocation to each of the n²/2 iterations.

<!-- @code python -->
```python
def longest_palindrome(s):
    best = ""
    for i in range(len(s)):
        for j in range(i, len(s)):
            if j - i + 1 > len(best):
                t = s[i:j + 1]
                if t == t[::-1]:
                    best = t
    return best


# The reference implementation, used to verify the other three over all
# 1,023 binary strings up to length 9 and 20,000 random ones -- zero
# mismatches. Not runnable at the sizes this problem allows.
```

<!-- @annotations -->
- 5: The length guard before slicing matters here more than in C++, since `s[i:j+1]` allocates and `t[::-1]` allocates again.

<!-- @approach -->
### Optimal - Expand Around Every Centre

<!-- @idea -->
Every palindrome is symmetric about a character or a gap, so try all 2n-1 centres and walk outward from each.

<!-- @steps -->
1. For each position, treat it as the centre of an odd-length palindrome.
2. Walk outward while the characters on both sides match and stay in bounds.
3. Do the same treating the gap after that position as an even-length centre.
4. Record the span whenever it beats the longest seen.
5. Return the substring at the recorded span.

<!-- @complexity -->
- time: O(n^2) worst case, and O(n) in practice — measured 1.54n character comparisons on random 26-letter input and exactly n²/2 on a string of identical characters
- space: O(1) beyond the returned substring
- note: The one to write. At n = 4,000 it measured 13.04 microseconds on random input against 29.96 for Manacher's and 7,704.51 for the DP table. The quadratic worst case is real — 3,900.62 microseconds on all-one-character input, and over a second at n = 64,000 — but it needs a highly repetitive input to reach. A 4,000-character string that is *entirely* a palindrome took 9.77 microseconds, because only one centre expands far.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

string longestPalindrome(const string& s) {
    if (s.empty()) return "";
    int n = s.size(), lo = 0, len = 1;

    auto grow = [&](int l, int r) {
        while (l >= 0 && r < n && s[l] == s[r]) { l--; r++; }
        if (r - l - 1 > len) { len = r - l - 1; lo = l + 1; }
    };

    for (int c = 0; c < n; c++) {
        grow(c, c);        // odd length, centred on a character
        grow(c, c + 1);    // even length, centred on the gap after it
    }
    return s.substr(lo, len);
}
```

<!-- @annotations -->
- 10: `r - l - 1` and `l + 1`, because the loop exits one step **past** the palindrome on each side. Off-by-one here yields a string that is not a palindrome, which the property check catches immediately.
- 14: Both centre kinds from the same index, which is how 2n-1 centres get covered by an n-iteration loop.
- 9: The bounds tests come first, so the character comparison never reads outside the string.

<!-- @code java -->
```java
static int lo, len;

static void grow(String s, int l, int r) {
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
    if (r - l - 1 > len) { len = r - l - 1; lo = l + 1; }
}

static String longestPalindrome(String s) {
    if (s.isEmpty()) return "";
    lo = 0; len = 1;
    for (int c = 0; c < s.length(); c++) {
        grow(s, c, c);
        grow(s, c, c + 1);
    }
    return s.substring(lo, lo + len);
}
```

<!-- @annotations -->
- 10: Resetting `lo` and `len` on entry, since they are static fields — returning them from `grow` instead avoids the shared mutable state entirely and is what to prefer in real code.

<!-- @code python -->
```python
def longest_palindrome(s):
    if not s:
        return ""
    n = len(s)
    lo, hi = 0, 0
    for c in range(n):
        for l0, r0 in ((c, c), (c, c + 1)):
            l, r = l0, r0
            while l >= 0 and r < n and s[l] == s[r]:
                l -= 1
                r += 1
            if r - l - 2 > hi - lo:
                lo, hi = l + 1, r - 1
    return s[lo:hi + 1]


# 713.3us at n = 2,000 on random input against 950.1 for Manacher's --
# and 119,632.7us against 1,205.5 on a string of identical characters.
```

<!-- @annotations -->
- 12: `r - l - 2` compares against `hi - lo`, which is an inclusive span rather than a length — mixing the two conventions is the single most common way to get this wrong.

<!-- @approach -->
### The DP Table

<!-- @idea -->
`s[i..j]` is a palindrome when its ends match and the substring inside it already is, so fill a table in order of increasing length.

<!-- @steps -->
1. Mark every single character as a palindrome.
2. Mark every adjacent equal pair as a palindrome.
3. For each length from three upward, and each start position, mark the span a palindrome when its ends match and the span one shorter inside it is marked.
4. Track the longest span marked.
5. Return that substring.

<!-- @complexity -->
- time: O(n^2) unconditionally — every cell is filled regardless of the input
- space: O(n^2) for the table, which is the disqualifying cost
- note: The clearest statement of what a palindrome is and the worst thing here to run. At n = 4,000 it measured 7,704.51 microseconds on random input against 13.04 for expansion — **591x** — and 34,765.10 on a two-letter alphabet, **2,128x**. It also allocates 16 MB where the alternatives use a few hundred bytes. The reason it loses even against the other quadratic approach is that expansion's quadratic case is conditional and this one's is not.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

string longestPalindrome(const string& s) {
    int n = s.size();
    if (n == 0) return "";
    vector<vector<char>> pal(n, vector<char>(n, 0));
    int lo = 0, len = 1;

    for (int i = 0; i < n; i++) pal[i][i] = 1;
    for (int i = 0; i + 1 < n; i++)
        if (s[i] == s[i + 1]) { pal[i][i + 1] = 1; if (2 > len) { len = 2; lo = i; } }

    for (int L = 3; L <= n; L++)
        for (int i = 0; i + L - 1 < n; i++) {
            int j = i + L - 1;
            if (s[i] == s[j] && pal[i + 1][j - 1]) {
                pal[i][j] = 1;
                if (L > len) { len = L; lo = i; }
            }
        }
    return s.substr(lo, len);
}
```

<!-- @annotations -->
- 8: n² bytes, which is 16 MB at n = 4,000 — the cost that rules this out regardless of speed. A single `vector<char>` indexed by `i * n + j` at least avoids n separate allocations.
- 15: Iterating by **length** rather than by index is what guarantees `pal[i+1][j-1]` is already filled when it is read.
- 12: The two base cases are separate because the recurrence needs a span two shorter, which does not exist for lengths one and two.

<!-- @code java -->
```java
static String longestPalindrome(String s) {
    int n = s.length();
    if (n == 0) return "";
    boolean[][] pal = new boolean[n][n];
    int lo = 0, len = 1;

    for (int i = 0; i < n; i++) pal[i][i] = true;
    for (int i = 0; i + 1 < n; i++)
        if (s.charAt(i) == s.charAt(i + 1)) { pal[i][i + 1] = true; len = 2; lo = i; }

    for (int L = 3; L <= n; L++)
        for (int i = 0; i + L - 1 < n; i++) {
            int j = i + L - 1;
            if (s.charAt(i) == s.charAt(j) && pal[i + 1][j - 1]) {
                pal[i][j] = true;
                if (L > len) { len = L; lo = i; }
            }
        }
    return s.substring(lo, lo + len);
}
```

<!-- @annotations -->
- 9: `len = 2; lo = i;` unconditionally is safe only because `len` starts at 1 and this loop runs before the length-3 pass; guarding it with `if (len < 2)` states the intent.

<!-- @code python -->
```python
def longest_palindrome(s):
    n = len(s)
    if n == 0:
        return ""
    pal = [[False] * n for _ in range(n)]
    lo, ln = 0, 1
    for i in range(n):
        pal[i][i] = True
    for i in range(n - 1):
        if s[i] == s[i + 1]:
            pal[i][i + 1] = True
            lo, ln = i, 2
    for L in range(3, n + 1):
        for i in range(n - L + 1):
            j = i + L - 1
            if s[i] == s[j] and pal[i + 1][j - 1]:
                pal[i][j] = True
                if L > ln:
                    lo, ln = i, L
    return s[lo:lo + ln]


# n^2 Python objects. At n = 4,000 that is 16 million list entries
# before any comparison happens -- unusable at the sizes this problem
# allows, and the reason no measurement of it appears above n = 4,000.
```

<!-- @annotations -->
- 5: A list of lists allocates n list objects plus n² references. This line alone costs more than the entire expansion approach does.

<!-- @approach -->
### Manacher's Algorithm

<!-- @idea -->
Compute the palindromic radius at every centre in one pass, reusing radii already known inside the rightmost palindrome found so far.

<!-- @steps -->
1. Interleave separators between every character and at both ends, so every palindrome becomes odd-length.
2. Track the rightmost palindrome seen and its centre.
3. At each position inside that palindrome, start its radius from its mirror's radius, capped by the distance to the right edge.
4. Extend outward from there while characters match.
5. Update the rightmost palindrome if this one reaches further.
6. Take the largest radius and map it back to the original string.

<!-- @complexity -->
- time: O(n) guaranteed — the right edge only ever advances, so the total extension work is bounded by n
- space: O(n) for the transformed string and the radius array
- note: The only approach here whose worst case is not quadratic, and on ordinary input it loses by a flat factor with **no crossover**: measured 3.49x, 3.52x, 3.52x, 3.44x and 3.36x slower than expansion at n from 1,000 to 256,000 on random text. Its case is the other column — **1,463x faster** at n = 64,000 on a string of identical characters, where expansion takes over a second. Write it when the input is adversarial or highly repetitive; otherwise it is a constant-factor tax for insurance.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <string>
#include <vector>
using namespace std;

string longestPalindrome(const string& s) {
    if (s.empty()) return "";
    string t = "^";
    t.reserve(2 * s.size() + 3);
    for (char c : s) { t += '#'; t += c; }
    t += "#$";

    int n = t.size();
    vector<int> rad(n, 0);
    int centre = 0, right = 0;
    for (int i = 1; i < n - 1; i++) {
        if (i < right) rad[i] = min(right - i, rad[2 * centre - i]);
        while (t[i + rad[i] + 1] == t[i - rad[i] - 1]) rad[i]++;
        if (i + rad[i] > right) { centre = i; right = i + rad[i]; }
    }

    int len = 0, ci = 0;
    for (int i = 1; i < n - 1; i++) if (rad[i] > len) { len = rad[i]; ci = i; }
    return s.substr((ci - len) / 2, len);
}
```

<!-- @annotations -->
- 11: The `^` and `$` sentinels are what let the extension loop on line 18 run without a bounds check — they can never match `#` or any real character.
- 17: Starting from the mirror's radius is the whole algorithm. Capping at `right - i` is required: beyond the known palindrome the mirror says nothing.
- 18: This loop looks like it could be quadratic and is not — `right` only ever increases, so across the whole scan it advances at most n times in total.

<!-- @code java -->
```java
static String longestPalindrome(String s) {
    if (s.isEmpty()) return "";
    StringBuilder sb = new StringBuilder("^");
    for (int i = 0; i < s.length(); i++) { sb.append('#').append(s.charAt(i)); }
    sb.append("#$");
    String t = sb.toString();

    int n = t.length();
    int[] rad = new int[n];
    int centre = 0, right = 0;
    for (int i = 1; i < n - 1; i++) {
        if (i < right) rad[i] = Math.min(right - i, rad[2 * centre - i]);
        while (t.charAt(i + rad[i] + 1) == t.charAt(i - rad[i] - 1)) rad[i]++;
        if (i + rad[i] > right) { centre = i; right = i + rad[i]; }
    }

    int len = 0, ci = 0;
    for (int i = 1; i < n - 1; i++) if (rad[i] > len) { len = rad[i]; ci = i; }
    return s.substring((ci - len) / 2, (ci - len) / 2 + len);
}
```

<!-- @annotations -->
- 13: `charAt` bounds-checks on every access, which costs more here than in C++ — the sentinels make those checks unnecessary but Java performs them anyway.

<!-- @code python -->
```python
def longest_palindrome(s):
    if not s:
        return ""
    t = "^#" + "#".join(s) + "#$"
    n = len(t)
    rad = [0] * n
    centre = right = 0
    for i in range(1, n - 1):
        if i < right:
            rad[i] = min(right - i, rad[2 * centre - i])
        while t[i + rad[i] + 1] == t[i - rad[i] - 1]:
            rad[i] += 1
        if i + rad[i] > right:
            centre, right = i, i + rad[i]
    length, ci = max((v, i) for i, v in enumerate(rad))
    start = (ci - length) // 2
    return s[start:start + length]


# 950.1us at n = 2,000 against 713.3 for expansion on random input --
# only 1.3x behind here, against 3.4x in C++ -- and 1,205.5 against
# 119,632.7 on a string of identical characters.
```

<!-- @annotations -->
- 4: `"#".join(s)` places separators between characters only, so the `#` on each side of the join is added explicitly — the transformed string is 2n + 3 characters.
- 15: `max` over `(value, index)` pairs breaks ties by the larger index, which is harmless since any longest palindrome is a valid answer.

<!-- @example -->

<!-- @input -->
s = "babad"

<!-- @output -->
"bab" — and "aba" is equally correct

<!-- @why -->
The smallest input with two valid answers, which is the case a fixed expected string rejects.

<!-- @walkthrough -->
1. There are 2n - 1 = 9 centres: five characters and four gaps.
2. Centred on index 0, `b` expands nowhere — there is nothing to its left.
3. Centred on index 1, `a` has `b` on both sides, giving `"bab"` of length 3.
4. Centred on index 2, `b` has `a` on both sides, giving `"aba"`, also length 3.
5. Both are longest, and the problem permits either.
6. Every gap centre fails immediately, since no two adjacent characters are equal.
7. Over all binary strings up to length 10, **19.3%** have more than one distinct longest palindromic substring — so the assertion should be that the answer is a palindrome, occurs in the input, and has the right length.

<!-- @example -->

<!-- @input -->
Two 4,000-character strings whose answer is the whole string

<!-- @output -->
9.77us for a mirrored random string, 3,900.62us for one of identical characters

<!-- @why -->
Separates "the answer is long" from "the input is repetitive", which is what actually drives the cost.

<!-- @walkthrough -->
1. The first is a random 26-letter half followed by its reverse, so the entire string is a palindrome.
2. The second is 4,000 copies of the same character, which is also entirely a palindrome.
3. Both have an answer of length 4,000, so a cost model based on the answer would predict the same time.
4. Measured, they differ by about **400x**.
5. In the mirrored string exactly one centre expands far — the true middle — and every other sits between two random characters and dies in a comparison or two.
6. Counting comparisons gives 14,300, which is 1.79 times 2n; the random non-palindromic string gives 12,295, or 1.54 times 2n.
7. In the repeated string every one of the 2n - 1 centres expands to the boundary, giving 8,010,000 comparisons — exactly n²/2.
8. The cost is the **sum** of the palindromic radii over all centres, not the largest one.

<!-- @example -->

<!-- @input -->
Random 26-letter text from 1,000 to 256,000 characters

<!-- @output -->
Manacher's stays 3.4x slower at every size — there is no crossover

<!-- @why -->
Tests the usual reason for reaching for a linear algorithm, and finds it does not apply on this input.

<!-- @walkthrough -->
1. The expectation with an O(n) algorithm against an O(n^2) one is that the linear one wins beyond some size.
2. Measured at n = 1,000: expansion 2.17 microseconds, Manacher's 7.57 — a ratio of 3.49.
3. At n = 4,000: 8.62 and 30.32, a ratio of 3.52.
4. At n = 16,000: 35.67 and 125.57, ratio 3.52. At 64,000: 145.48 and 500.30, ratio 3.44.
5. At n = 256,000: 595.24 and 1,997.60, ratio 3.36.
6. The ratio is flat because expansion is **already linear** on this input — 1.54n comparisons — so Manacher's is competing against O(n), not O(n^2).
7. Manacher's also builds a transformed string of 2n + 3 characters and a radius array it fills completely, which expansion never allocates.
8. The crossover people wait for arrives only when the input becomes repetitive.

<!-- @example -->

<!-- @input -->
A string of 64,000 identical characters

<!-- @output -->
1,062,429.53us for expansion against 726.43us for Manacher's — 1,463x

<!-- @why -->
The case Manacher's exists for, and the one that justifies its constant-factor tax everywhere else.

<!-- @walkthrough -->
1. Every one of the 127,999 centres expands until it hits a boundary.
2. The total comparison count is n²/2, or about two billion.
3. Measured, expansion takes over a second.
4. Manacher's takes 0.73 milliseconds on the same input, because its right edge advances at most n times in total no matter how the characters are arranged.
5. The gap grows with n exactly as the complexity classes predict: 21x at n = 1,000, 86x at 4,000, 351x at 16,000, 1,463x at 64,000.
6. Python shows the same shape at smaller sizes — 404x at n = 8,000.
7. This input is not exotic: long runs of a single character occur in DNA, in run-length-encodable data, and in anything an adversary supplies.
8. The decision is therefore about the input distribution, not about the sizes involved.

<!-- @visualization custom -->

<!-- @description -->
Draw the string as a row of cells and mark all 2n-1 centres beneath it — a tick under each character and a tick in each gap — so the count is visible before anything moves. Then run the expansion, letting a pair of arms open outward from each centre in turn and snap shut the moment the characters differ, leaving a small radius bar behind. On random text almost every bar is one or two cells tall and the row of bars looks flat; that flatness is the linear behaviour, so hold on it and print the running comparison count reaching 1.54 times 2n. Now swap the input to a string of identical characters and replay: every pair of arms opens all the way to the boundary, the bars form a solid triangle, and the counter climbs to n²/2. The two bar profiles side by side are the whole cost model. Next, the case that corrects the obvious intuition. Put a mirrored random string beside the repeated one, both with their full length highlighted as the answer, and show that the first has exactly one tall bar with everything else flat while the second is solid — same answer, 9.77us against 3,900.62us, with the caption the cost is the sum of the radii, not the maximum. Then Manacher's, animated as the reuse it is: draw the rightmost known palindrome as a bracket, and when the cursor lands inside it, show the mirror position's bar being copied across before any comparison happens, with the extension continuing only past the bracket's edge. Keep a counter on the bracket's right edge showing it only ever moves right, never left — that monotonicity is the linear-time proof. Close with two plots on one axis, n from 1,000 to 256,000: on random text the two lines stay parallel with Manacher's a constant 3.4x above, labelled no crossover; on repeated characters they diverge, expansion curving up to 1,062,429us at 64,000 while Manacher's stays flat at 726, labelled 1,463x.

<!-- @sampleInput -->
```json
{"primary":{"s":"babad","validAnswers":["bab","aba"],"centres":9,"note":"2n-1 centres: 5 characters and 4 gaps"},"smallCases":[{"s":"babad","validAnswers":["bab","aba"]},{"s":"cbbd","validAnswers":["bb"]},{"s":"a","validAnswers":["a"]},{"s":"ac","validAnswers":["a","c"]},{"s":"","validAnswers":[""]},{"s":"aaaa","validAnswers":["aaaa"]}],"ties":{"measured":"over all binary strings up to length 10","withMultipleDistinctAnswers":394,"of":2046,"share":"19.3%","guidance":"assert that the result is a palindrome, occurs in the input, and has the right length — a fixed expected string rejects correct solutions"},"centreIdea":{"claim":"every palindrome is symmetric about a character or a gap, so there are exactly 2n-1 centres","consequence":"a search over O(n^2) substrings becomes a scan over O(n) centres, each a single outward walk"},"expansionWork":{"claim":"the cost is the SUM of the palindromic radii over all centres, not the maximum","measured":[{"shape":"random, 26 letters","n2000":6154,"n8000":24627,"ratioToTwoN":"1.54x at both sizes"},{"shape":"random, 4 letters","n2000":7305,"n8000":29338,"ratioToTwoN":"1.83x at both sizes"},{"shape":"random, 2 letters","n2000":9908,"n8000":39802,"ratioToTwoN":"2.49x at both sizes"},{"shape":"aabbaabb...","n2000":506000,"n8000":8024000,"ratioToTwoN":"n^2/8"},{"shape":"ababab...","n2000":1005000,"n8000":16020000,"ratioToTwoN":"n^2/4"},{"shape":"all one character","n2000":2005000,"n8000":32020000,"ratioToTwoN":"n^2/2"}],"reading":"on random input the work is linear and the ratio is identical at both sizes; the alphabet sets the constant"},"longAnswerIsNotSlow":{"n":4000,"rows":[{"shape":"random 26 letters","answerLength":5,"comparisons":12295,"us":13.04},{"shape":"whole string is a palindrome","answerLength":4000,"comparisons":14300,"us":9.77},{"shape":"all one character","answerLength":4000,"comparisons":8010000,"us":3900.62}],"reading":"the last two have the same answer length and differ by about 400x — the palindromic string has exactly one centre that expands far, the repeated string has every centre expanding far"},"benchCpp":{"unit":"microseconds per run, Apple M2, clang -O2","atN4000":[{"shape":"rand26","answer":5,"expand":13.04,"dpTable":7704.51,"manacher":29.96},{"shape":"rand4","answer":13,"expand":10.90,"dpTable":20664.89,"manacher":35.41},{"shape":"rand2","answer":31,"expand":16.32,"dpTable":34765.10,"manacher":48.04},{"shape":"whole string is a palindrome","answer":4000,"expand":9.77,"dpTable":7647.42,"manacher":37.06},{"shape":"abab...","answer":3999,"expand":1817.34,"dpTable":11221.86,"manacher":48.97},{"shape":"all one character","answer":4000,"expand":3900.62,"dpTable":20996.78,"manacher":45.67}],"noCrossoverOnRandomText":[{"n":1000,"expand":2.17,"manacher":7.57,"ratio":"3.49x"},{"n":4000,"expand":8.62,"manacher":30.32,"ratio":"3.52x"},{"n":16000,"expand":35.67,"manacher":125.57,"ratio":"3.52x"},{"n":64000,"expand":145.48,"manacher":500.30,"ratio":"3.44x"},{"n":256000,"expand":595.24,"manacher":1997.60,"ratio":"3.36x"}],"onAllOneCharacter":[{"n":1000,"expand":245.71,"manacher":11.48,"ratio":"21x"},{"n":4000,"expand":3905.51,"manacher":45.40,"ratio":"86x"},{"n":16000,"expand":64146.27,"manacher":182.57,"ratio":"351x"},{"n":64000,"expand":1062429.53,"manacher":726.43,"ratio":"1463x"}],"reading":"the ratio on random text is flat from 1,000 to 256,000 because expansion is already linear there — Manacher's is competing against O(n), not O(n^2)"},"benchPython":{"unit":"microseconds per run, CPython 3.13.4","rows":[{"shape":"rand26","n":2000,"answer":4,"expand":713.3,"manacher":950.1,"note":"manacher 1.3x slower"},{"shape":"rand26","n":8000,"answer":5,"expand":2417.2,"manacher":3570.6,"note":"manacher 1.5x slower"},{"shape":"rand2","n":2000,"answer":21,"expand":879.0,"manacher":1180.2,"note":"manacher 1.3x slower"},{"shape":"whole string is a palindrome","n":8000,"answer":8000,"expand":2709.7,"manacher":4128.0,"note":"manacher 1.5x slower"},{"shape":"all one character","n":2000,"answer":2000,"expand":119632.7,"manacher":1205.5,"note":"expand 99x slower"},{"shape":"all one character","n":8000,"answer":8000,"expand":1966353.0,"manacher":4866.3,"note":"expand 404x slower"}]},"dpTableVerdict":{"time":"O(n^2) unconditionally","space":"O(n^2) — 16 MB at n = 4,000","vsExpansion":"591x behind on random 26-letter input, 2128x on a two-letter alphabet","vsManacher":"460x behind on all-one-character input","whyItLoses":"expansion's quadratic case is conditional and this one's is not","worthKnowing":"the recurrence is the clearest statement of what a palindrome is"},"verification":{"exhaustive":{"space":"all binary strings up to length 9","strings":1023,"mismatches":0,"checked":"same length as brute force, is a palindrome, and occurs in the input"},"random":{"trials":20000,"alphabet":3,"mismatches":0},"cppCrossCheck":{"inputs":20000,"mismatches":0}},"assertions":["the result is a palindrome","the result occurs in the input","no longer palindromic substring exists","the result is empty exactly when the input is empty","any two correct answers have the same length"],"recommendation":"expand around centres — a dozen lines, O(1) extra space, and fastest on any input that is not highly repetitive; switch to Manacher's when the input may be adversarial, DNA, binary, or long runs of one character","lesson":"a quadratic bound describes the worst case, not the case — and here the linear-time alternative has no crossover on ordinary input because the quadratic one was already linear on it"}
```

<!-- @highlights -->
- The string is drawn as a row of cells with all 2n-1 centres marked beneath — a tick under each character and one in each gap.
- Arms open outward from each centre in turn and snap shut the moment the characters differ, leaving a radius bar behind.
- On random text nearly every bar is one or two cells tall, and that flat row of bars is the linear behaviour.
- A running comparison counter reaches 1.54 times 2n.
- The input switches to identical characters and replays: every pair of arms opens to the boundary and the bars form a solid triangle.
- The counter climbs to n²/2, and the two bar profiles side by side are the whole cost model.
- A mirrored random string sits beside the repeated one, both with their full length highlighted as the answer.
- The first shows exactly one tall bar with everything else flat; the second is solid — 9.77us against 3,900.62us.
- The caption reads the cost is the sum of the radii, not the maximum.
- Manacher's is animated as the reuse it is: the rightmost known palindrome is drawn as a bracket.
- When the cursor lands inside the bracket, the mirror position's bar is copied across before any comparison happens.
- Extension continues only past the bracket's edge, and a counter on the right edge shows it only ever moves right.
- That monotonicity is the linear-time proof, drawn rather than argued.
- The close is two plots on one axis, n from 1,000 to 256,000.
- On random text the lines stay parallel with Manacher's a constant 3.4x above, labelled no crossover.
- On repeated characters they diverge — expansion curving to 1,062,429us at 64,000 while Manacher's stays flat at 726 — labelled 1,463x.

<!-- @edgeCases -->
- The empty string — the answer is empty, and every version must guard before indexing.
- A single character — the answer is that character, and the case where `len` must start at 1 rather than 0.
- Two different characters, like `"ac"` — the answer is either one, and the smallest input with a tie.
- Two identical characters — the answer is both, and the smallest input where an even-length centre matters.
- No repeated character anywhere — every expansion dies immediately and the answer is a single character.
- The whole string is a palindrome — the answer is the input, reached from a single centre, and **fast** rather than slow.
- All characters identical — the answer is the input, and the quadratic worst case for expansion at n²/2 comparisons.
- A two-letter alphabet — 2.49n comparisons rather than 1.54n, since matches are more likely.
- Alternating characters, like `"ababab"` — n²/4 comparisons, half the all-same worst case.
- An even-length answer straddling the middle — missed entirely by a version that only tries character centres.
- Very long input with a repetitive prefix — expansion's cost is driven by the repetitive region regardless of where the answer is.

<!-- @pitfalls -->
- Trying only character centres. Even-length palindromes are centred on gaps, so `"cbbd"` returns `"c"` instead of `"bb"` — 2n-1 centres, not n.
- Getting the span arithmetic wrong after expansion. The loop exits one past the palindrome on each side, so the length is `r - l - 1` and the start is `l + 1`.
- Mixing length and inclusive-span conventions. Comparing `r - l - 1` against a stored `hi - lo` is off by one, and the result is a string that is not a palindrome.
- Testing against one expected answer. **19.3%** of binary strings up to length 10 have more than one distinct longest palindromic substring.
- Assuming a long answer means slow. A 4,000-character string that is entirely a palindrome ran in 9.77 microseconds; a repeated-character string with the same answer length took 3,900.62.
- Reaching for Manacher's for speed on ordinary input. Measured 3.4x slower at every size from 1,000 to 256,000, with no crossover.
- Reaching for the DP table at all. 591x to 2,128x behind expansion in time and O(n²) in memory — 16 MB at n = 4,000.
- Forgetting the sentinels in Manacher's. Without `^` and `$` the extension loop needs bounds checks on both sides of every step.
- Omitting the `min(right - i, ...)` cap in Manacher's. Beyond the known palindrome the mirror's radius says nothing, and copying it uncapped gives wrong answers.
- Using shared mutable state for the best span. Returning it from the expansion helper keeps the function reentrant and removes a reset that is easy to forget.
- Slicing inside the brute-force loops. Checking the length first skips every candidate that could not win, which is the only thing making it survivable at all.

<!-- @doubt -->
### Why 2n-1 centres and not n?

<!-- @answer -->
Because palindromes come in two shapes. An odd-length one like `"aba"` is symmetric about a **character**; an even-length one like `"bb"` is symmetric about the **gap** between two characters. A string of length n has n characters and n-1 gaps, so 2n-1 centres in total, and every palindromic substring expands from exactly one of them. Trying only character centres is the most common wrong answer to this problem and it fails on `"cbbd"`, which returns `"c"` instead of `"bb"`. In code it is one extra call per position — `grow(c, c)` for odd and `grow(c, c + 1)` for even — so the loop still runs n times while covering all 2n-1.

<!-- @doubt -->
### Is expanding around centres not O(n^2)?

<!-- @answer -->
It is, and that bound is almost never reached. Counting the actual character comparisons on random 26-letter text: **6,154 at n = 2,000 and 24,627 at n = 8,000** — that is 1.54 times 2n at both sizes, and a ratio that stays constant as n grows is the definition of linear. The reason is that two randomly chosen characters usually differ, so nearly every expansion dies after a comparison or two. The alphabet sets the constant: 1.54n at 26 letters, 1.83n at 4, and 2.49n at 2. The quadratic case is real but needs repetition to reach — a string of identical characters gives exactly n²/2 comparisons, `"ababab..."` gives n²/4, and `"aabbaabb..."` gives n²/8.

<!-- @doubt -->
### When should I use Manacher's algorithm?

<!-- @answer -->
When the input might be repetitive or adversarial, and not otherwise — because on ordinary text there is **no crossover to wait for**. Measured on random 26-letter input, Manacher's was 3.49x slower at n = 1,000, 3.52x at 4,000, 3.52x at 16,000, 3.44x at 64,000 and 3.36x at 256,000. The ratio is flat because expansion is already linear on that input, so the linear-time algorithm is competing against O(n) rather than O(n²), while also allocating a transformed string of 2n+3 characters and a radius array. The other column is the entire case for it: on a string of 64,000 identical characters, expansion took **1,062,429 microseconds** and Manacher's **726** — 1,463x. You are not buying speed, you are buying the absence of a worst case.

<!-- @doubt -->
### Does a long answer make the expansion slow?

<!-- @answer -->
No, and this is the most useful thing to understand about the cost. Take two 4,000-character strings that are **both entirely palindromes**: one a random 26-letter half mirrored, the other 4,000 copies of one character. Both have an answer of length 4,000. The first measured **9.77 microseconds** and the second **3,900.62** — about 400x apart. In the mirrored string exactly one centre expands far, the true middle; every other centre sits between two unrelated characters and dies immediately, giving 14,300 comparisons in total. In the repeated string every one of the 2n-1 centres expands to the boundary, giving 8,010,000. The cost is the **sum** of the palindromic radii across all centres, not the largest of them.

<!-- @doubt -->
### Why is the DP table so much worse than expansion when both are O(n^2)?

<!-- @answer -->
Because one of the quadratics is conditional and the other is not. Expansion reaches n²/2 comparisons only when the input forces every centre to expand far; on random text it does linear work. The DP table fills every one of the n²/2 cells regardless of the input, so it pays its worst case on every input. Measured at n = 4,000: 7,704.51 microseconds against 13.04 for expansion on random 26-letter text, which is **591x**, and 34,765.10 against 16.32 on a two-letter alphabet, **2,128x**. It is also 460x behind Manacher's on the all-one-character input where expansion finally loses. And it allocates n² bytes — 16 MB at n = 4,000 — where both alternatives use a few hundred. The recurrence is the clearest description of what a palindrome is, which is why it is worth reading, and it is not worth running.

<!-- @doubt -->
### My answer differs from the expected one but looks right. Is it wrong?

<!-- @answer -->
Probably not. Ties are common: over every binary string up to length 10, **394 of 2,046 — 19.3%** have more than one distinct longest palindromic substring, and the problem explicitly permits any of them. `"babad"` admits both `"bab"` and `"aba"`; `"ac"` admits `"a"` and `"c"`. A test that compares against one fixed string will reject correct solutions on roughly a fifth of inputs. Assert the properties instead: the result is a palindrome, it occurs in the input, and its length equals the true maximum. That is exactly how the four implementations here were cross-checked against brute force over all 1,023 binary strings up to length 9 and 20,000 random ones, with zero mismatches.

<!-- @doubt -->
### Why does Manacher's inner `while` loop not make it quadratic?

<!-- @answer -->
Because of what it is allowed to touch. The loop only extends **past** the rightmost palindrome discovered so far — everything inside that palindrome was already resolved by copying the mirror's radius, at no comparison cost. And the right edge only ever moves right; it never retreats. So across the entire scan, the extension loop can advance that edge at most n positions in total, no matter how many iterations enter it. It is the same amortisation argument as the sliding window in **Count Number of Substrings**, where an inner `while` inside a `for` still totals 2n pointer moves. The two pieces that make it work are the `min(right - i, rad[mirror])` cap, which stops you trusting the mirror beyond the known region, and the sentinels, which let the extension run without bounds checks.
