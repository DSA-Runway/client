---
id: rotate-string
topic: Strings
title: Rotate String
difficulty: Easy
status: ready
prerequisites:
  - for-loop
  - nested-loops
  - if-else-statements
  - isomorphic-string
  - longest-common-prefix
  - time-and-space-complexity-basics
relatedIds:
  - isomorphic-string
  - check-if-two-strings-are-anagram-of-each-other
  - left-rotate-array-by-k-places
  - longest-common-prefix
  - reverse-every-word-in-a-string
---

<!-- @summary -->
Decide whether one string is a rotation of another — where every rotation of `s` is a substring of `s + s`, verified with zero exceptions over 5,461 exhaustive pairs, collapsing the problem to one containment test; and where that one-liner is **quadratic in C++ and linear in Python** on the same input, so at n = 16,000 the compiled version measured 6,521.6us against the interpreted one's 19.29us — a 338x loss to the language everyone assumes is slower, decided entirely by which substring search the standard library ships.

<!-- @theory -->
## The problem

Given `s` and `goal`, return true if `s` becomes `goal` after some number of left
shifts. A left shift moves the first character to the end.

```
s = "abcde"   goal = "cdeab"   ->  true    two shifts
s = "abcde"   goal = "abced"   ->  false   no shift produces this
s = "abcde"   goal = "abcde"   ->  true    zero shifts counts
```

The stated constraint is small — both strings at most 100 characters — and that
turns out to matter a great deal for what you should write. Held until the end,
because the reasoning is more useful than the conclusion.

## Every rotation lives inside `s + s`

Write `s` down twice:

```
s = "abcde"

s + s  =  a b c d e a b c d e
          |---------|              abcde
            |---------|            bcdea
              |---------|          cdeab
                |---------|        deabc
                  |---------|      eabcd
```

Every window of length `n` starting at positions 0 through n-1 is exactly one
rotation, and there are `n` of them — all of them. So:

**`goal` is a rotation of `s` if and only if `s` and `goal` have the same length
and `goal` is a substring of `s + s`.**

Verified over every ordered pair of equal-length strings up to length 6 on a
two-letter alphabet — 5,461 pairs, zero mismatches.

## The length check is not optional

Drop it and the lemma breaks, because containment does not imply equal length.
`s = "a"`, `goal = ""`: the empty string is a substring of `"aa"`, so the
unguarded test says true. `s = "a"`, `goal = "aa"`: `"aa"` is a substring of
`"aa"`, so again true.

Exhaustively over all pairs up to length 5, including unequal lengths:

| | Pairs |
|---|---|
| Unequal length | 2,604 |
| **Wrongly accepted without the length check** | **780 (29.95%)** |
| Wrong on any equal-length pair | **0** |

Nearly a third of unequal-length pairs slip through. This is the same shape of
defect as the `zip` truncation in **Isomorphic String** — an idea that is exactly
right on equal-length input and silently wrong off it, where the guard costs one
comparison.

## Not every string has n distinct rotations

Worth knowing before you trust a loop that tries all of them:

| String | Distinct rotations | Length |
|---|---|---|
| `abcd` | 4 | 4 |
| `abab` | **2** | 4 |
| `aabaab` | **3** | 6 |
| `aaaa` | **1** | 4 |

A periodic string repeats its rotations. The brute-force loop still works — it
just re-tests the same candidate several times — but it explains why the
adversarial inputs below are the ones made of repeated characters.

## The one-liner's complexity is a property of your standard library

Here is the claim usually attached to `goal in s + s`: it is O(n). That is true
only if the substring search is linear, and **whether it is depends entirely on
the language**.

Take the worst case for a naive scanner: `s = "a" * n` and
`goal = "a" * (n-1) + "b"`. Same length, not a rotation. A naive search matches
n-1 characters at every one of ~n starting positions before failing on the last.

**C++, `(s + s).find(goal)` with libc++:**

| n | Microseconds | Growth per doubling |
|---|---|---|
| 1,000 | 26.7 | |
| 2,000 | 110.6 | **x4.13** |
| 4,000 | 473.6 | x4.28 |
| 8,000 | 1,695.0 | x3.57 |
| 16,000 | 6,482.6 | **x3.82** |

Quadratic, unmistakably — a linear method doubles.

**Python, `goal in s + s` with CPython 3.13:**

| n | Microseconds | Growth per doubling |
|---|---|---|
| 1,000 | 1.42 | |
| 2,000 | 3.61 | x2.53 |
| 4,000 | 6.56 | x1.82 |
| 8,000 | 10.39 | x1.58 |
| 16,000 | 19.29 | **x1.86** |

Linear. CPython's string search is a two-way (Crochemore-Perrin) algorithm with a
bad-character shift; `std::string::find` in libc++ is a straightforward scan.

**Same algorithm, same input, at n = 16,000: C++ 6,521.6us, Python 19.29us.**
The compiled language is **338x slower** than the interpreted one, and nothing
about the code you wrote explains it. The library did.

## The C++ fix, and what it costs

`std::search` with an explicit searcher restores the guarantee:

| n = 16,000, adversarial | Microseconds |
|---|---|
| `string::find` | 6,528.0 |
| `std::search` + `boyer_moore_searcher` | **64.0** |
| `std::search` + `boyer_moore_horspool_searcher` | **20.7** |

But run the same three on ordinary random input where a true rotation is found:

| n = 16,000, random | Microseconds |
|---|---|
| `string::find` | **1.99** |
| `boyer_moore_searcher` | 63.84 |
| `boyer_moore_horspool_searcher` | 12.24 |

`find` is **32x faster** here, because the searchers pay to build shift tables
that the naive scan does not need when the first character rules out almost every
position. So the choice is a bet on the input, exactly as the early exit was in
**Largest Odd Number in a String**.

## The full picture, and the inversion

Microseconds, C++, adversarial input on the left and ordinary random input with a
true rotation on the right, both at n = 16,000:

| Approach | Adversarial | Ordinary |
|---|---|---|
| Try every rotation | 154,169.8 | 14.68 |
| `(s+s).find` | 6,521.6 | **2.69** |
| Modular comparison, no concatenation | 153,790.3 | 14.63 |
| KMP over the concatenation | **122.5** | 80.12 |
| Booth's canonical form | 131.8 | 246.30 |

KMP is **53x faster** than the one-liner on adversarial input and **30x slower**
on ordinary input. Booth is worse still on ordinary input, at 246.30 against 2.69.
There is no approach here that wins both columns.

And in Python the safe-looking advice is a disaster. Hand-written KMP on the
adversarial input measured **4,220.1us against the builtin's 19.29** — writing
your own linear algorithm to avoid a quadratic builtin makes it **219x slower**,
because the builtin was never quadratic and your loop is interpreted.

## Booth's algorithm, and why it is here

Booth's algorithm finds the lexicographically smallest rotation in O(n). That
gives a **canonical form**: two strings are rotations of each other exactly when
their least rotations are equal — zero mismatches over the same 5,461 pairs.

For one comparison it is the wrong tool, at 246.30 microseconds against 2.69. Its
value is the same as the first-occurrence encoding in **Isomorphic String**: it
is a **hashable key**. Grouping 10,000 strings into rotation classes is one pass
with the key and about 50 million pairwise tests without it. Canonical forms are
for grouping; predicates are for pairs.

## What you should actually write

At the stated constraint of 100 characters, measured on a random true rotation:

| Approach | Microseconds |
|---|---|
| Try every rotation | 0.110 |
| **`(s+s).find`** | **0.062** |
| Modular comparison | 0.109 |
| KMP | 0.622 |
| Booth | 1.891 |

Everything is under two microseconds, and the two linear-guarantee algorithms are
the **slowest** on the page because their setup dominates at this size. At
n <= 100 the quadratic worst case is 10,000 character comparisons, which is
nothing.

**So write the one-liner.** `len(s) == len(goal) and goal in s + s`, with the
guard. The rest of this container is what changes when the constraint does — when
this test sits inside a system where an adversary or a log file supplies the
strings, and where the difference between 2.69 and 6,521.6 microseconds is a
choice you made without noticing.

<!-- @intuition -->
Writing the string down twice is one of those moves that looks like a trick and is really just a change of representation: laid end to end, every rotation of s becomes a window into s + s, so a question about n different strings turns into one question about a single string. That is the same instinct as the first-occurrence encoding in Isomorphic String — stop comparing the objects and find the object that already contains all the comparisons. The part worth carrying further is what happens next. Having collapsed the problem to a substring search, you have quietly delegated the entire complexity of your solution to whatever search your standard library ships, and the answer differs by language: the identical one-liner is quadratic in C++ and linear in Python, and the gap on adversarial input is large enough that the interpreted version beats the compiled one by more than two orders of magnitude. Complexity analysis that stops at your own code stops too early. Whatever you called is part of your algorithm.

<!-- @approach -->
### Try Every Rotation

<!-- @idea -->
Generate each of the n rotations in turn and compare it against the goal.

<!-- @steps -->
1. Return false if the lengths differ.
2. Return true if both strings are empty.
3. For each shift from zero to n minus one, compare the rotated string against the goal character by character.
4. Read the rotated character with modular indexing rather than building the rotated string.
5. Return true on the first shift that matches every position.
6. Return false if no shift matches.

<!-- @complexity -->
- time: O(n^2) — n shifts, each compared in up to O(n)
- space: O(1) with modular indexing, O(n) if each rotation is materialised
- note: The direct reading of the problem, and the only approach here with no hidden dependence on a library. Measured 0.110 microseconds at the stated limit of n = 100 — the fastest but one, because at that size the asymptotics have not started. At n = 16,000 it measured 154,169.8 microseconds on adversarial input. Building each rotation as a fresh string instead of using modular indexing measured within noise of it (153,790.3), so the allocation is not what costs — the comparisons are.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

bool rotateString(const string& s, const string& goal) {
    if (s.size() != goal.size()) return false;
    size_t n = s.size();
    if (n == 0) return true;
    for (size_t k = 0; k < n; k++) {
        size_t i = 0;
        while (i < n && s[(k + i) % n] == goal[i]) i++;
        if (i == n) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 10: `s[(k + i) % n]` reads the rotated string without building it, so this is O(1) space. Measured the same speed as materialising each rotation — the win is the allocation, not the time.
- 11: The inner loop stops at the first mismatch, which is why ordinary input is fast and repeated characters are not.

<!-- @code java -->
```java
static boolean rotateString(String s, String goal) {
    if (s.length() != goal.length()) return false;
    int n = s.length();
    if (n == 0) return true;
    for (int k = 0; k < n; k++) {
        int i = 0;
        while (i < n && s.charAt((k + i) % n) == goal.charAt(i)) i++;
        if (i == n) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 7: `(k + i) % n` is safe from overflow here because both are bounded by n, but `k + i` on an `int` with n near 2^31 would not be.

<!-- @code python -->
```python
def rotate_string(s, goal):
    if len(s) != len(goal):
        return False
    if not s:
        return True
    return any(s[k:] + s[:k] == goal for k in range(len(s)))


# Slicing is clearer than modular indexing in Python and no slower in
# practice, since both slices happen in C. Measured 3,288.7us at
# n = 16,000 against 22.32 for the one-liner.
```

<!-- @annotations -->
- 6: `any` short-circuits, so a rotation found early costs less. The slices still build two new strings per candidate, which is why this is 147x the one-liner at n = 16,000.

<!-- @approach -->
### Optimal - The Doubling Lemma

<!-- @idea -->
Every rotation of `s` is a window of `s + s`, so the whole question is one substring search.

<!-- @steps -->
1. Return false if the lengths differ — containment alone does not imply equal length.
2. Concatenate the first string with itself.
3. Search that for the goal as a substring.
4. Return whether it was found.

<!-- @complexity -->
- time: O(n) plus the cost of the substring search, which is the library's choice and not yours — linear in CPython, quadratic worst case with libc++'s `string::find`
- space: O(n) for the concatenation
- note: The one to write, and the one whose complexity is not determined by the code you wrote. On the adversarial input `s = "a"*n`, `goal = "a"*(n-1)+"b"`, C++ measured 6,521.6 microseconds at n = 16,000 growing x3.82 per doubling, while the identical Python one-liner measured 19.29 growing x1.86 — the interpreted version is **338x faster** because CPython searches with a two-way algorithm and libc++ scans. On ordinary input C++ is the fastest thing here, at 2.69.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

bool rotateString(const string& s, const string& goal) {
    return s.size() == goal.size() && (s + s).find(goal) != string::npos;
}
```

<!-- @annotations -->
- 5: The length check is load-bearing. Without it `s = "a"`, `goal = ""` returns true, and 29.95% of unequal-length pairs are wrongly accepted. The `find` is the other half: it is a naive scan in libc++, so if the strings can be adversarial, see the KMP approach or pass a `boyer_moore_horspool_searcher` to `std::search` — measured 20.7 microseconds against 6,528.0 at n = 16,000.

<!-- @code java -->
```java
static boolean rotateString(String s, String goal) {
    return s.length() == goal.length() && (s + s).contains(goal);
}
```

<!-- @annotations -->
- 2: `String.contains` delegates to `indexOf`, which is also a naive scan in the reference implementation, so Java shares C++'s worst case rather than Python's.

<!-- @code python -->
```python
def rotate_string(s, goal):
    return len(s) == len(goal) and goal in (s + s)


# The whole problem. CPython's substring search is a two-way algorithm
# with a bad-character shift, so this stays linear even on the input
# that makes the same one-liner quadratic in C++ -- 19.29us against
# 6,521.6 at n = 16,000.
```

<!-- @annotations -->
- 2: `len(s) == len(goal)` first, and `and` short-circuits, so the concatenation never happens when the lengths differ.

<!-- @approach -->
### KMP Over the Concatenation

<!-- @idea -->
Do the substring search yourself with an algorithm that is linear in the worst case, instead of trusting the library's.

<!-- @steps -->
1. Return false if the lengths differ.
2. Build the failure table for the goal — for each prefix, the length of the longest proper prefix that is also a suffix.
3. Walk the doubled string one character at a time, reading it with modular indexing so no concatenation is built.
4. On a mismatch, fall back through the failure table rather than restarting.
5. Return true as soon as the match length reaches n.
6. Return false if the walk finishes.

<!-- @complexity -->
- time: O(n) worst case, guaranteed, with no dependence on the library
- space: O(n) for the failure table, and no concatenation needed
- note: The approach that wins the column nobody tests. Measured 122.5 microseconds at n = 16,000 on adversarial input against 6,521.6 for the one-liner — **53x** — and 80.12 against 2.69 on ordinary input, which is **30x the wrong way**. It buys a guarantee and pays for it on every ordinary input. In Python it is a mistake outright: 4,220.1 microseconds against the builtin's 19.29, because the builtin was never quadratic and this loop is interpreted.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

bool rotateString(const string& s, const string& goal) {
    if (s.size() != goal.size()) return false;
    size_t n = s.size();
    if (n == 0) return true;

    vector<int> fail(n, 0);
    for (size_t i = 1; i < n; i++) {
        int j = fail[i - 1];
        while (j && goal[i] != goal[j]) j = fail[j - 1];
        if (goal[i] == goal[j]) j++;
        fail[i] = j;
    }

    int j = 0;
    for (size_t i = 0; i < 2 * n; i++) {
        char c = s[i < n ? i : i - n];
        while (j && c != goal[j]) j = fail[j - 1];
        if (c == goal[j]) j++;
        if ((size_t)j == n) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 20: `s[i < n ? i : i - n]` walks the doubled string without allocating it, so this uses O(n) for the table and nothing for the text. It is also where the fallback happens: because `j` only ever decreases here and increases at most once per character, the total work is O(n) no matter what the input looks like.
- 22: Checking after the increment, so a match ending at the last character is still caught.

<!-- @code java -->
```java
static boolean rotateString(String s, String goal) {
    if (s.length() != goal.length()) return false;
    int n = s.length();
    if (n == 0) return true;
    int[] fail = new int[n];
    for (int i = 1; i < n; i++) {
        int j = fail[i - 1];
        while (j > 0 && goal.charAt(i) != goal.charAt(j)) j = fail[j - 1];
        if (goal.charAt(i) == goal.charAt(j)) j++;
        fail[i] = j;
    }
    int j = 0;
    for (int i = 0; i < 2 * n; i++) {
        char c = s.charAt(i < n ? i : i - n);
        while (j > 0 && c != goal.charAt(j)) j = fail[j - 1];
        if (c == goal.charAt(j)) j++;
        if (j == n) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 5: Java arrays are zero-initialised, so `fail[0] = 0` is already correct and needs no separate statement.

<!-- @code python -->
```python
def rotate_string(s, goal):
    if len(s) != len(goal):
        return False
    n = len(s)
    if n == 0:
        return True
    fail = [0] * n
    j = 0
    for i in range(1, n):
        while j and goal[i] != goal[j]:
            j = fail[j - 1]
        if goal[i] == goal[j]:
            j += 1
        fail[i] = j
    j = 0
    for i in range(2 * n):
        c = s[i] if i < n else s[i - n]
        while j and c != goal[j]:
            j = fail[j - 1]
        if c == goal[j]:
            j += 1
        if j == n:
            return True
    return False


# Do not write this in Python. Measured 4,220.1us on the adversarial
# input where `goal in s + s` measured 19.29 -- 219x slower, because
# the builtin is already linear and this loop is interpreted.
```

<!-- @annotations -->
- 22: Correct and linear, and still the wrong choice. An O(n) interpreted loop loses to an O(n) C loop by the interpreter's constant factor, which here is two orders of magnitude.

<!-- @approach -->
### Booth's Algorithm - A Canonical Form for Grouping

<!-- @idea -->
Reduce each string to its lexicographically smallest rotation; rotations of each other reduce to the same string.

<!-- @steps -->
1. Walk two candidate starting positions through the doubled string at once.
2. Compare the characters at the same offset from each candidate.
3. Advance the offset while they agree.
4. On a disagreement, discard the candidate with the larger character by jumping it past the matched region.
5. Keep the surviving candidate as the start of the least rotation.
6. Two strings are rotations exactly when their least rotations are equal.

<!-- @complexity -->
- time: O(n) to produce the canonical form
- space: O(n) for the resulting string
- note: Here for the same reason the first-occurrence encoding is in **Isomorphic String** — it is a hashable key, so grouping 10,000 strings into rotation classes is one pass rather than about 50 million pairwise tests. For a single pair it is the worst choice on the page, measured 246.30 microseconds at n = 16,000 against 2.69 for the one-liner, because a canonical form has to read everything before it can compare anything.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <string>
using namespace std;

string leastRotation(const string& s) {
    size_t n = s.size();
    if (n == 0) return s;
    auto at = [&](size_t i) { return s[i < n ? i : i - n]; };
    size_t i = 0, j = 1, k = 0;
    while (i < n && j < n && k < n) {
        char a = at(i + k), b = at(j + k);
        if (a == b) { k++; continue; }
        if (a > b) i = i + k + 1; else j = j + k + 1;
        if (i == j) j++;
        k = 0;
    }
    size_t start = min(i, j);
    string out;
    out.reserve(n);
    for (size_t x = 0; x < n; x++) out += at(start + x);
    return out;
}

bool rotateString(const string& s, const string& goal) {
    return s.size() == goal.size() && leastRotation(s) == leastRotation(goal);
}
```

<!-- @annotations -->
- 13: The jump past the matched region is what makes this linear. Advancing by one instead would be correct and quadratic.
- 14: `if (i == j) j++` keeps the two candidates distinct after a jump lands one on the other.

<!-- @code java -->
```java
static String leastRotation(String s) {
    int n = s.length();
    if (n == 0) return s;
    int i = 0, j = 1, k = 0;
    while (i < n && j < n && k < n) {
        char a = s.charAt((i + k) % n), b = s.charAt((j + k) % n);
        if (a == b) { k++; continue; }
        if (a > b) i = i + k + 1; else j = j + k + 1;
        if (i == j) j++;
        k = 0;
    }
    int start = Math.min(i, j);
    StringBuilder out = new StringBuilder(n);
    for (int x = 0; x < n; x++) out.append(s.charAt((start + x) % n));
    return out.toString();
}

static boolean rotateString(String s, String goal) {
    return s.length() == goal.length() && leastRotation(s).equals(leastRotation(goal));
}
```

<!-- @annotations -->
- 19: `.equals`, not `==`. Reference comparison on two separately built Strings is false regardless of content.

<!-- @code python -->
```python
def least_rotation(s):
    n = len(s)
    if n == 0:
        return s
    ss = s + s
    i, j, k = 0, 1, 0
    while i < n and j < n and k < n:
        a, b = ss[i + k], ss[j + k]
        if a == b:
            k += 1
            continue
        if a > b:
            i = i + k + 1
        else:
            j = j + k + 1
        if i == j:
            j += 1
        k = 0
    start = min(i, j)
    return ss[start:start + n]


def rotate_string(s, goal):
    return len(s) == len(goal) and least_rotation(s) == least_rotation(goal)


# The point is grouping, not this comparison:
#     classes.setdefault(least_rotation(w), []).append(w)
# turns a quadratic pile of pairwise tests into one pass.
```

<!-- @annotations -->
- 5: Building `s + s` up front makes the indexing plain. The C++ version uses a wrapping lambda instead to avoid the allocation.

<!-- @example -->

<!-- @input -->
s = "abcde", goal = "cdeab"

<!-- @output -->
true

<!-- @why -->
The standard case, and the one where the doubling lemma is visible rather than argued.

<!-- @walkthrough -->
1. Both strings have length 5, so the guard passes.
2. `s + s` is `"abcdeabcde"`.
3. The five windows of length 5 starting at positions 0 to 4 are `abcde`, `bcdea`, `cdeab`, `deabc`, `eabcd`.
4. Those are exactly the five rotations of `s`, in shift order.
5. `"cdeab"` appears at position 2, so the answer is true and the shift count was 2.
6. The brute-force loop reaches the same answer by testing k = 0, then 1, then 2.
7. Booth's algorithm instead reduces both strings to their least rotation, `"abcde"`, and finds them equal.

<!-- @example -->

<!-- @input -->
s = "a", goal = "" — and s = "a", goal = "aa"

<!-- @output -->
false for both, but the unguarded containment test says true for both

<!-- @why -->
Pins down why the length check is part of the lemma rather than defensive padding.

<!-- @walkthrough -->
1. `s + s` is `"aa"` in both cases.
2. The empty string is a substring of every string, so `"" in "aa"` is true.
3. `"aa"` is trivially a substring of `"aa"`, so that is true as well.
4. Neither goal has the same length as `s`, so neither can be a rotation of it.
5. A rotation permutes characters and cannot change how many there are.
6. Exhaustively over all pairs up to length 5, dropping the guard wrongly accepts 780 of the 2,604 unequal-length pairs — 29.95%.
7. On equal-length pairs the unguarded test is exactly correct, which is what makes the omission survive testing.

<!-- @example -->

<!-- @input -->
s = "aaaa...a" (16,000 chars), goal = "aaa...ab" (16,000 chars)

<!-- @output -->
false — in 6,521.6us from C++ and 19.29us from Python

<!-- @why -->
The same one-liner, the same input, and a 338x gap that nothing in either program explains.

<!-- @walkthrough -->
1. The lengths match, so both implementations proceed to the containment test.
2. `s + s` is 32,000 identical characters; the goal is 15,999 of them followed by a `b`.
3. A naive scanner matches 15,999 characters at each starting position, then fails on the last one.
4. There are about 16,000 such positions, so the work is about 256 million character comparisons.
5. libc++'s `string::find` does exactly that, measured 6,521.6 microseconds and growing x3.82 per doubling.
6. CPython's `in` uses a two-way algorithm with a bad-character shift, measured 19.29 microseconds and growing x1.86 per doubling.
7. The compiled language loses by 338x on identical logic, because the complexity was never in the logic.
8. Passing `boyer_moore_horspool_searcher` to `std::search` brings C++ to 20.7 microseconds — and costs it 32x on ordinary input.

<!-- @example -->

<!-- @input -->
The stated constraint: strings of at most 100 characters

<!-- @output -->
Every approach finishes in under two microseconds, and the linear ones are slowest

<!-- @why -->
Settles what to actually write, and shows that the two algorithms with the better guarantees lose at the size the problem specifies.

<!-- @walkthrough -->
1. At n = 100 the quadratic worst case is about 10,000 character comparisons.
2. Measured on a random true rotation: trying every rotation took 0.110 microseconds.
3. The doubling one-liner took 0.062, the fastest of the five.
4. Modular comparison took 0.109, essentially the same as trying every rotation.
5. KMP took 0.622 — ten times the one-liner, because building the failure table dominates at this size.
6. Booth took 1.891, the slowest, for the same reason.
7. So at the stated constraint the linear-guarantee algorithms are the slow ones, and the one-liner is both the shortest and the fastest.
8. Everything in this container above that line is about what changes when the constraint does not hold.

<!-- @visualization custom -->

<!-- @description -->
Open on `s` written once, then slide a copy of it in from the right until the two sit end to end as `s + s`, and drag a window of length n across the join — letting each position snap to show the rotation it spells, with a shift counter ticking 0, 1, 2 beneath it. The window passing the join is the whole lemma, so let it linger there. Stack the n windows as a column beside the doubled string to show that they are exactly the n rotations and that there are no others. Next, the guard: put `s = "a"` above `goal = ""` and draw the containment test succeeding with a green tick, then drop a length comparator in front of it that flips the tick to a cross, with a counter beside it reading 780 of 2,604 unequal-length pairs wrongly accepted. Then the centre of the figure, which is the search itself. Show the adversarial input as a bar of identical cells with one odd cell at the end, and animate two searchers over it side by side: the naive scan restarting after each near-miss, its comparison counter climbing into the hundreds of millions, against the two-way search skipping ahead in large jumps with a counter that stays flat. Label them libc++ `string::find` and CPython `in`, and put the two timings under them at 6,521.6us and 19.29us with the ratio 338x between. The point to land is that the two programs are the same one line. Follow it with the honesty panel: the same two searchers on ordinary random input, where the naive scan finishes almost instantly at 2.69us and the careful algorithms trail at 80.12 and 246.30 — the ranking visibly inverting from the frame before. Close on scale. Draw the stated constraint, n = 100, as a small tile beside the 16,000-character bar, and print the five timings at that size — 0.110, 0.062, 0.109, 0.622, 1.891 — with the two linear-guarantee algorithms highlighted as the slowest, captioned at the size this problem specifies, the guarantees cost more than they save.

<!-- @sampleInput -->
```json
{"primary":{"s":"abcde","goal":"cdeab","answer":true,"shifts":2,"doubled":"abcdeabcde","foundAt":2},"smallCases":[{"s":"abcde","goal":"cdeab","answer":true},{"s":"abcde","goal":"abced","answer":false},{"s":"abcde","goal":"abcde","answer":true,"note":"zero shifts counts"},{"s":"","goal":"","answer":true},{"s":"a","goal":"","answer":false,"note":"unguarded containment says true"},{"s":"a","goal":"aa","answer":false,"note":"unguarded containment says true"}],"lemma":{"claim":"goal is a rotation of s iff the lengths match and goal is a substring of s + s","why":"the n windows of length n starting at positions 0..n-1 of s+s are exactly the n rotations","windowsForAbcde":["abcde","bcdea","cdeab","deabc","eabcd"],"verifiedOver":"5461 ordered equal-length pairs over {a,b}, lengths 0..6","mismatches":0},"lengthGuard":{"whyNeeded":"containment does not imply equal length","counterexamples":[{"s":"a","goal":"","unguarded":true,"truth":false},{"s":"a","goal":"aa","unguarded":true,"truth":false}],"exhaustive":{"allPairsUpToLength5":3969,"unequalLengthPairs":2604,"wronglyAccepted":780,"falseAcceptRate":"29.95%","wrongOnEqualLengthPairs":0},"relatedTo":"the same shape of defect as the zip truncation in Isomorphic String"},"periodicity":{"note":"a periodic string has fewer than n distinct rotations","examples":[{"s":"abcd","distinctRotations":4,"length":4},{"s":"abab","distinctRotations":2,"length":4},{"s":"aabaab","distinctRotations":3,"length":6},{"s":"aaaa","distinctRotations":1,"length":4}],"consequence":"explains why the adversarial inputs are made of repeated characters"},"adversarialInput":{"s":"a repeated n times","goal":"a repeated n-1 times then b","equalLength":true,"isRotation":false,"whyItHurts":"a naive scanner matches n-1 characters at each of about n starting positions before failing"},"libraryDependence":{"headline":"the same one-liner is quadratic in C++ and linear in Python","cppFind":{"impl":"libc++ std::string::find, a naive scan","rows":[{"n":1000,"us":26.7},{"n":2000,"us":110.6,"growth":"x4.13"},{"n":4000,"us":473.6,"growth":"x4.28"},{"n":8000,"us":1695.0,"growth":"x3.57"},{"n":16000,"us":6482.6,"growth":"x3.82"}],"verdict":"quadratic"},"pythonIn":{"impl":"CPython two-way (Crochemore-Perrin) with a bad-character shift","rows":[{"n":1000,"us":1.42},{"n":2000,"us":3.61,"growth":"x2.53"},{"n":4000,"us":6.56,"growth":"x1.82"},{"n":8000,"us":10.39,"growth":"x1.58"},{"n":16000,"us":19.29,"growth":"x1.86"}],"verdict":"linear"},"atN16000":{"cpp":6521.6,"python":19.29,"ratio":"338x — the interpreted language wins"},"lesson":"complexity analysis that stops at your own code stops too early; whatever you called is part of your algorithm"},"cppSearchers":{"adversarialAtN16000":[{"method":"string::find","us":6528.0},{"method":"std::search + boyer_moore_searcher","us":64.0},{"method":"std::search + boyer_moore_horspool_searcher","us":20.7}],"ordinaryAtN16000":[{"method":"string::find","us":1.99},{"method":"std::search + boyer_moore_searcher","us":63.84},{"method":"std::search + boyer_moore_horspool_searcher","us":12.24}],"reading":"find is 32x faster on ordinary input and 315x slower on adversarial input — the choice is a bet on the input"},"benchCpp":{"unit":"microseconds per run, Apple M2, clang -O2, libc++","atStatedConstraintN100":{"tryEveryRotation":0.110,"doublingFind":0.062,"modularCompare":0.109,"kmp":0.622,"booth":1.891,"reading":"everything is sub-microsecond and the two linear-guarantee algorithms are the slowest"},"adversarial":[{"n":1000,"brute":612.2,"doublingFind":26.8,"modular":635.4,"kmp":8.6,"booth":9.4},{"n":2000,"brute":2528.6,"doublingFind":115.4,"modular":2431.0,"kmp":16.4,"booth":16.7},{"n":4000,"brute":9703.7,"doublingFind":472.9,"modular":9690.9,"kmp":33.5,"booth":33.0},{"n":8000,"brute":38585.4,"doublingFind":1700.0,"modular":40663.5,"kmp":65.5,"booth":66.1},{"n":16000,"brute":154169.8,"doublingFind":6521.6,"modular":153790.3,"kmp":122.5,"booth":131.8}],"ordinaryRandomTrueRotation":[{"n":1000,"brute":0.89,"doublingFind":0.18,"modular":0.88,"kmp":4.47,"booth":18.51},{"n":4000,"brute":3.56,"doublingFind":0.58,"modular":3.67,"kmp":21.10,"booth":71.90},{"n":16000,"brute":14.68,"doublingFind":2.69,"modular":14.63,"kmp":80.12,"booth":246.30}],"inversion":{"kmpVsOneLiner":{"adversarial":"53x faster","ordinary":"30x slower"},"boothOrdinary":"246.30 against 2.69","verdict":"no approach wins both columns"},"methodology":"otherwise idle machine"},"benchPython":{"unit":"microseconds per run, CPython 3.13.4","adversarial":[{"n":1000,"oneLiner":1.42,"kmp":251.4,"booth":152.8},{"n":2000,"oneLiner":3.61,"kmp":524.7,"booth":305.0},{"n":4000,"oneLiner":6.56,"kmp":1039.9,"booth":612.0},{"n":8000,"oneLiner":10.39,"kmp":2141.5,"booth":1251.2},{"n":16000,"oneLiner":19.29,"kmp":4220.1,"booth":2474.2}],"ordinaryRandomTrueRotation":[{"n":1000,"oneLiner":1.36,"brute":58.8,"kmp":127.0,"booth":333.3},{"n":4000,"oneLiner":4.87,"brute":350.9,"kmp":510.5,"booth":1255.3},{"n":16000,"oneLiner":22.32,"brute":3288.7,"kmp":2053.7,"booth":5351.4}],"handWrittenKmpVerdict":"4220.1us against the builtin's 19.29 on adversarial input — 219x slower; writing your own linear algorithm to dodge a quadratic builtin is wrong here because the builtin was never quadratic"},"canonicalForm":{"algorithm":"Booth's least rotation","claim":"two strings are rotations iff their least rotations are equal","verifiedOver":"5461 exhaustive pairs","mismatches":0,"realUse":"a hashable key — grouping 10000 strings into rotation classes is one pass instead of about 50 million pairwise tests","weakness":"no early exit; 246.30us against 2.69 for a single pair at n = 16000","parallel":"the same role the first-occurrence encoding plays in Isomorphic String"},"assertions":["equal lengths, or the answer is false","the answer is true iff goal appears in s+s at some position 0..n-1","every string is a rotation of itself","the relation is symmetric: rotate(s, goal) equals rotate(goal, s)","a periodic string has fewer than n distinct rotations"],"recommendation":"at the stated 100-character constraint, write the guarded one-liner — it is both the shortest and the fastest; reach for KMP or an explicit searcher only when the input size is unbounded and the strings may be adversarial","lesson":"the doubling lemma collapses the problem to a substring search, and then the standard library decides your complexity class"}
```

<!-- @highlights -->
- `s` is written once, then a copy slides in from the right until the two sit end to end as `s + s`.
- A window of length n drags across the join, snapping at each position to show the rotation it spells, with a shift counter ticking 0, 1, 2.
- The window passing the join lingers, because that is the whole lemma.
- The n windows stack as a column beside the doubled string, showing they are exactly the n rotations and there are no others.
- `s = "a"` sits above `goal = ""` with the containment test showing a green tick.
- A length comparator drops in front and flips the tick to a cross, beside a counter reading 780 of 2,604 unequal-length pairs wrongly accepted.
- The adversarial input appears as a bar of identical cells with one odd cell at the end.
- Two searchers animate over it side by side: the naive scan restarting after each near-miss, its comparison counter climbing into the hundreds of millions.
- The two-way search skips ahead in large jumps with a counter that stays flat.
- They are labelled libc++ `string::find` and CPython `in`, with timings of 6,521.6us and 19.29us and the ratio 338x between them.
- The point lands that the two programs are the same one line.
- The honesty panel follows: the same two searchers on ordinary random input.
- There the naive scan finishes almost instantly at 2.69us while the careful algorithms trail at 80.12 and 246.30, the ranking visibly inverting from the frame before.
- The close is scale: the stated constraint n = 100 drawn as a small tile beside the 16,000-character bar.
- The five timings at that size read 0.110, 0.062, 0.109, 0.622 and 1.891.
- The two linear-guarantee algorithms are highlighted as the slowest.
- The caption reads at the size this problem specifies, the guarantees cost more than they save.

<!-- @edgeCases -->
- Both strings empty — a rotation of each other, and the loop-based versions must return true by falling through rather than by finding a match.
- One empty, one not — false, and the case the missing length guard gets wrong, since the empty string is a substring of everything.
- `s` equals `goal` — true, because zero shifts is a valid number of shifts; a loop starting at k = 1 gets this wrong.
- Single characters — `"a"` and `"a"` is true, `"a"` and `"b"` is false; the smallest pair that exercises the comparison at all.
- All characters identical — true whenever the lengths match, and the input that makes a naive search do the most work.
- A periodic string like `"abab"` — only 2 distinct rotations of 4, so the brute-force loop tests the same candidate twice.
- Equal length, differing by one character at the end — false, and the adversarial case for `string::find`, measured 6,521.6us at n = 16,000.
- Unequal lengths where the shorter is a substring of the longer doubled — the exact shape the guard exists to reject, 29.95% of unequal-length pairs.
- `n` near the container's maximum with `s + s` — the concatenation doubles memory; the modular and KMP versions avoid it entirely.
- Strings supplied by an untrusted source — the case where the library's search algorithm stops being an implementation detail.

<!-- @pitfalls -->
- Omitting the length check. Containment does not imply equal length, and without it 780 of 2,604 unequal-length pairs are wrongly accepted — 29.95%.
- Assuming `goal in s + s` is O(n). It is linear in CPython and quadratic with libc++'s `string::find`, measured 19.29us against 6,521.6 on the same input at n = 16,000.
- Assuming the compiled language is faster. On that input the identical one-liner is 338x faster in Python, because the complexity lives in the library rather than the code.
- Writing KMP in Python to be safe. Measured 4,220.1us against the builtin's 19.29 — 219x slower, since the builtin was never quadratic.
- Reaching for `boyer_moore_searcher` by default in C++. It is 315x faster on adversarial input and 32x slower on ordinary input, because the shift tables have to be built either way.
- Starting the rotation loop at k = 1. Zero shifts is a legal rotation, so `s == goal` must return true.
- Building each rotation as a fresh string. Modular indexing gives the same speed with O(1) space — measured 153,790.3 against 154,169.8 microseconds, which is noise.
- Using Booth's algorithm to compare a single pair. It has no early exit and measured 246.30us against 2.69 for the one-liner; its value is as a hash key when grouping.
- Assuming a string has n distinct rotations. `"aaaa"` has one and `"abab"` has two, so a loop over all n tests duplicates.
- Optimising this problem at all under the stated constraint. At n = 100 every approach is under two microseconds, and KMP and Booth are the two slowest.

<!-- @doubt -->
### Why does `s + s` contain every rotation?

<!-- @answer -->
Because a rotation is a window that wraps around the end, and writing the string twice removes the wrap. Take `s = "abcde"`; then `s + s` is `"abcdeabcde"`, and the windows of length 5 starting at positions 0 through 4 are `abcde`, `bcdea`, `cdeab`, `deabc`, `eabcd` — the five rotations in shift order, and nothing else, because a window starting at position 5 or later is just a repeat. So "is `goal` one of the n rotations" becomes "does `goal` appear anywhere in `s + s`", which is a single substring search. Verified over all 5,461 ordered equal-length pairs up to length 6 on a two-letter alphabet, with zero mismatches.

<!-- @doubt -->
### Do I really need the length check?

<!-- @answer -->
Yes, and it is part of the lemma rather than defensive padding. Containment does not constrain length: the empty string is a substring of `"aa"`, so `s = "a"`, `goal = ""` passes the containment test, and `"aa"` is a substring of `"aa"`, so `s = "a"`, `goal = "aa"` passes too. Neither is a rotation, because a rotation permutes characters and cannot change how many there are. Measured over all 3,969 ordered pairs up to length 5, dropping the guard wrongly accepts **780 of the 2,604 unequal-length pairs — 29.95%** — while being exactly correct on every equal-length pair. That combination is what lets the omission survive testing, and it is the same shape as the `zip` truncation in Isomorphic String.

<!-- @doubt -->
### Is the one-liner O(n) or not?

<!-- @answer -->
That depends on your standard library, which is the real lesson here. On `s = "a"*n` and `goal = "a"*(n-1)+"b"`, C++ with libc++ measured 26.7, 110.6, 473.6, 1,695.0 and 6,482.6 microseconds at n = 1,000 through 16,000 — growth of x4.13, x4.28, x3.57, x3.82 per doubling, which is quadratic. CPython on the identical input measured 1.42, 3.61, 6.56, 10.39 and 19.29 — growth of x2.53, x1.82, x1.58, x1.86, which is linear. `std::string::find` is a naive scan; CPython's substring search is a two-way algorithm with a bad-character shift. So the same one line is O(n·m) in one language and O(n) in the other, and at n = 16,000 the interpreted version is **338x faster**.

<!-- @doubt -->
### Should I write KMP instead, then?

<!-- @answer -->
In C++, only if the input can be adversarial — and know what it costs. KMP measured 122.5 microseconds at n = 16,000 on the adversarial input against 6,521.6 for the one-liner, a 53x win. On ordinary random input it measured 80.12 against 2.69, a 30x loss. You are buying a guarantee and paying for it on every normal input. A cheaper C++ fix is `std::search` with a `boyer_moore_horspool_searcher`, at 20.7 microseconds adversarial and 12.24 ordinary — flatter than both. In Python, do not write KMP at all: it measured 4,220.1 microseconds where the builtin measured 19.29, because you would be replacing a linear C algorithm with a linear interpreted one.

<!-- @doubt -->
### What is Booth's algorithm doing here if it loses?

<!-- @answer -->
It answers a different question, and it is here for the same reason the first-occurrence encoding is in Isomorphic String. Booth's algorithm finds the lexicographically smallest rotation in O(n), which is a **canonical form**: two strings are rotations of each other exactly when their least rotations are equal, verified over the same 5,461 pairs with no mismatches. That makes the result a hashable key. Grouping 10,000 strings into rotation classes costs one pass with the key and about 50 million pairwise tests without it. For deciding a single pair it is the worst option on the page — 246.30 microseconds against 2.69 — because a canonical form must read all of its input before it can compare anything. Canonical forms are for grouping; predicates are for pairs.

<!-- @doubt -->
### Can I avoid building `s + s`?

<!-- @answer -->
Yes, and it costs nothing in time while saving the allocation. Read the doubled string with `s[i < n ? i : i - n]`, or with `s[(k + i) % n]` for the rotation loop — both give the wrapped view without a second buffer. Measured, the modular-comparison version and the version that materialises each rotation are within noise of each other at 153,790.3 against 154,169.8 microseconds, so the copying was never the cost; the character comparisons were. The KMP approach uses the same trick and needs only the O(n) failure table. This matters when `n` is large enough that doubling the memory is the constraint rather than the time.

<!-- @doubt -->
### So what should I write for this problem?

<!-- @answer -->
The guarded one-liner: `len(s) == len(goal) and goal in s + s`. At the stated constraint of 100 characters, measured on a random true rotation, it took 0.062 microseconds — the fastest of the five approaches — while KMP took 0.622 and Booth 1.891. The two algorithms with the better worst-case guarantees are the two slowest at this size, because their setup cost dominates when the quadratic worst case is only 10,000 character comparisons. Everything else in this container is about what changes when the constraint does not hold: unbounded input, strings from an untrusted source, or this test sitting inside a hot path where 2.69 and 6,521.6 microseconds are both plausible outcomes of the same line.

<!-- @doubt -->
### Does it matter which string I pass first?

<!-- @answer -->
No — being a rotation is symmetric, and that is a useful property to test with. If `goal` is `s` shifted left by `k`, then `s` is `goal` shifted left by `n - k`, so `rotateString(s, goal)` and `rotateString(goal, s)` must always agree. The relation is also reflexive, since zero shifts is allowed, and transitive, which together make it an equivalence relation — and that is exactly what licenses Booth's canonical form, since equivalence classes are what canonical forms name. As a test, feeding both orders of every pair catches an implementation that starts its shift loop at `k = 1` and so denies that a string is a rotation of itself.
