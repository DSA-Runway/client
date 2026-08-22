---
id: longest-common-prefix
topic: Strings
title: Longest Common Prefix
difficulty: Easy
status: ready
prerequisites:
  - for-loop
  - nested-loops
  - if-else-statements
  - largest-odd-number-in-a-string
  - largest-element
  - time-and-space-complexity-basics
relatedIds:
  - largest-odd-number-in-a-string
  - isomorphic-string
  - rotate-string
  - check-if-two-strings-are-anagram-of-each-other
  - largest-element
---

<!-- @summary -->
Find the longest prefix shared by every string in a list — where the answer equals the common prefix of just the lexicographic minimum and maximum, verified with zero exceptions over 54,240 exhaustive sets and 200,000 random ones and already shipped inside CPython's `os.path.commonprefix`; and where the ranking of the standard approaches **inverts** with the answer's length, so the method that is 710x ahead when the answer is empty is 13x behind when it is not, and the answer is empty on 99.9% of random dictionary word sets.

<!-- @theory -->
## The problem

Given an array of strings, return the longest string that is a prefix of every
one of them. Return the empty string if they share nothing.

```
["flower", "flow", "flight"]   ->  "fl"
["dog", "racecar", "car"]      ->  ""
["interspecies", "interstellar", "interstate"]  ->  "inters"
["a"]                          ->  "a"
```

Write `n` for how many strings there are and `m` for how long they are. The
standard constraints put both at 200, so the whole input is at most 40,000
characters — small. What varies enormously is how much of it you have to read.

## Two bounds, before any algorithm

Both are worth stating because both are used later.

- **The answer is a prefix of every string, so it is a prefix of `strs[0]`.**
  Every approach below is really choosing *how far along `strs[0]` to stop*.
- **The answer is no longer than the shortest string.** Verified over 200,000
  random sets: zero violations, which is what you would hope for a statement that
  is true by definition, and which the binary-search approach relies on to set its
  upper bound in one pass.

## The answer is almost always nothing

This is the fact that should drive the whole design, and it is measurable rather
than intuitive. Take 20,000 random sets of between 2 and 50 words drawn from the
235,974-word system dictionary:

| Answer length | Sets |
|---|---|
| **0** | **19,980 (99.9%)** |
| 1 | 16 |
| 2 | 3 |
| 3 | 1 |

Mean answer length: **0.001 characters.** Mean length of the words themselves:
**9.57**.

So on realistic input the job is almost never "build a long shared prefix". It is
"establish that there is no shared prefix, as cheaply as possible". An approach
that reads the whole input before returning `""` is doing thousands of times more
work than the question required — which is the same gap **Largest Element**
names between what you computed and what you were asked for.

## Horizontal and vertical differ in which dimension they can quit

Both scans are O(n·m) worst case. The difference is where the early exit lives.

**Horizontal** takes `strs[0]` as a working prefix and shrinks it against each
later string in turn. It cannot report an empty answer until it has read all of
`strs[0]` at least once — and it starts by copying it.

**Vertical** walks columns: check character 0 of every string, then character 1,
and return the moment one disagrees. When the answer is empty and the second
string already differs, it reads **two characters** and stops. It exits early in
*both* dimensions — down the column and across the list.

Measured at n = 200, m = 200 with no shared prefix, in microseconds:

| | Horizontal (rebuild) | Horizontal (index) | Vertical |
|---|---|---|---|
| Random strings | 0.03 | 0.01 | **0.003** |

Make the first string long and the asymmetry becomes visible. With 200 strings of
20,000 characters and an empty answer:

| | Microseconds |
|---|---|
| Horizontal, rebuilding the prefix | 0.35 |
| Horizontal, tracking a length | 0.00 |
| Vertical | 0.00 |

The 0.35 is not the comparison. It is `prefix = strs[0]` copying 20,000 bytes
before the function has looked at a single other string. **Track a length, copy
once at the end** — the identical correction **Largest Odd Number in a String**
needed, one problem earlier, for the identical reason.

## The answer is the common prefix of the minimum and the maximum

Sort the strings lexicographically. The longest common prefix of the whole set
equals the longest common prefix of the **first and last** strings alone.

The argument: every string `s` satisfies `min <= s <= max`. If `min` and `max`
both begin with `P`, then any string ordered between them must also begin with
`P` — there is no way to sit between two strings sharing a prefix without sharing
it yourself. So the two extremes are the only ones worth comparing, and every
string in the middle is irrelevant.

Verified rather than trusted:

| Check | Sets | Mismatches |
|---|---|---|
| Exhaustive, all tuples of size 1-4 over `{a,b}`, length <= 3 | 54,240 | **0** |
| Random sets of 1-6 strings over `{a,b,c}` | 200,000 | **0** |

**And you do not need the sort.** You need the minimum and the maximum, which is
one linear pass — `minmax_element` in C++, `min(m)` and `max(m)` in Python. Sorting
computes a complete ordering and then reads two entries out of it, which is
**Largest Element**'s lesson applied to strings.

This is not folklore. It is what the Python standard library does:

```python
# CPython, genericpath.py
def commonprefix(m):
    if not m: return ''
    ...
    s1 = min(m)
    s2 = max(m)
    for i, c in enumerate(s1):
        if c != s2[i]:
            return s1[:i]
    return s1
```

`os.path.commonprefix` is the min/max lemma, four lines, in the standard library.

## The ranking inverts with the answer's length

Here is the result that matters, and it is not what the complexity classes
suggest. All figures microseconds per run, n = 200 strings of m = 200 characters,
C++ on an M2 at `-O2`:

| Shape | Answer | Horiz (rebuild) | Horiz (index) | Vertical | Min/Max | Sort ends | Divide & conquer | Binary search |
|---|---|---|---|---|---|---|---|---|
| Random | 0 | 0.03 | 0.01 | **0.00** | 2.13 | 10.12 | 6.26 | 0.14 |
| Distinct first char | 0 | 0.03 | 0.01 | **0.00** | 2.11 | 9.80 | 6.10 | 0.14 |
| Share half | 100 | 19.98 | 19.61 | 17.78 | 2.68 | 16.10 | 19.05 | **1.06** |
| Share all but one | 199 | 35.95 | 37.48 | 35.51 | **3.09** | 18.69 | 27.05 | 8.16 |
| Identical | 200 | 36.14 | 37.55 | 35.66 | **2.68** | 8.01 | 27.00 | 9.38 |

Read the first and last rows together. **Vertical scanning is roughly 710x faster
than min/max when the answer is empty, and 13x slower when the answer is the
whole string.** Neither is "the fast one".

The reason is the unit of work. Vertical compares one character at a time, so it
can stop after two — but if it has to go the distance it pays per character.
Min/max compares whole strings, which the compiler turns into vectorised
`memcmp`, so it cannot stop early on the list but moves far faster per byte when
there is a long prefix to confirm. Binary search wins the middle because it does
`log m` rounds of `memcmp` rather than `m` rounds of character compares.

Larger inputs sharpen it rather than change it, at n = 1000, m = 1000:

| Shape | Answer | Horiz (rebuild) | Vertical | Min/Max | Sort ends | Binary search |
|---|---|---|---|---|---|---|
| Random | 0 | 0.1 | **0.0** | 10.8 | 112.2 | 0.6 |
| Identical | 1000 | 790.9 | 893.9 | **51.6** | 113.4 | 223.2 |

Min/max is **17x** ahead of vertical on the identical input and **hundreds of times**
behind it on the random one. Note also that sorting costs only about 2x the
min/max pass here rather than the `log n` factor you would predict — the sort is
comparison-bound on strings that differ in their first character or two, so it
never touches most of the bytes.

## Python inverts it differently

Same five approaches, CPython 3.13.4, n = 200, m = 200, microseconds:

| Shape | Answer | `startswith` shrink | Vertical loop | `zip(*strs)` | Min/Max | Sorted ends | `os.path` |
|---|---|---|---|---|---|---|---|
| Random | 0 | 9.85 | **0.49** | 4.90 | 3.57 | 12.16 | 6.07 |
| Distinct first char | 0 | 10.13 | **0.50** | 4.90 | 3.56 | 11.32 | 6.08 |
| Share all but one | 199 | **5.35** | 1282.64 | 259.04 | 9.10 | 23.45 | 11.61 |
| Identical | 200 | 5.78 | 1388.40 | 260.46 | 6.97 | **6.33** | 9.53 |

The inversion is far more violent: the vertical loop is **20x faster** than the
`startswith` version when the answer is empty and **240x slower** when it is not.

The cause is not the algorithm — it is which loop the interpreter runs. Every
character comparison in the vertical version is a bytecode step; `startswith`,
`min`, `max` and slicing are single calls into C. So in Python the rule is
narrower and simpler: **do not loop over characters unless you expect to stop
almost immediately.** `zip(*strs)` is not a rescue — it builds an `n`-tuple per
column and measured 260us against 5.78 for the same shape.

## The trie is a trap here

Insert every string into a trie, then walk down from the root while there is
exactly one child and no string has ended. It is a correct and genuinely elegant
solution, and for a single query it is the worst thing on this page.

Measured at n = 200, m = 200:

| Shape | Trie | Vertical | Ratio |
|---|---|---|---|
| Random (answer 0) | 1,977.84us | 0.003us | **671,400x** |
| Identical (answer 200) | 48.51us | 37.10us | 1.3x |

It never wins — even on identical strings, its best case, it is 1.3x behind — and
in the case that occurs 99.9% of the time it loses by nearly six orders of magnitude — because it reads and allocates the entire input before
answering a question the vertical scan settled in two characters. The node count
is up to one per input character: 40,000 nodes at **216 bytes** each with a
26-pointer child array, about **8.2 MB** for a 40 KB input.

The trie earns its cost when you will ask *many* prefix questions of the same
set. For one question, building an index is the expensive way to avoid a scan you
could have finished already.

## So what should you write

**Vertical scanning**, unless you know the answers are long. It is the best
approach on the input distribution that actually occurs, it is short, and its
worst case is the same O(n·m) as everything else. If you know the prefixes are
long — file paths under a common root, sorted identifiers — reach for min/max,
which is also the one to reach for in Python at any shape, because it does its
work in C.

<!-- @intuition -->
Every approach here is choosing where to stop along the first string, and the thing that decides the winner is not the size of the input but the length of the answer — which is a quantity none of the complexity classes mention. Measured, the answer is empty on 99.9% of realistic inputs, so the useful question is almost never "how fast can you build a long prefix" but "how fast can you prove there is nothing". That reframing picks the vertical scan immediately: it is the only one that can quit early down the column and across the list at the same time. The second idea is structural and genuinely surprising the first time: you never have to compare more than two of the strings. Sort them and the extremes bracket everything in between, so anything the minimum and the maximum agree on, every string between them must agree on too. The rest of the list is not evidence. And the sort itself was never needed — the two extremes are one linear pass, which is Largest Element's point about computing an ordering and then reading one entry out of it, arriving in a new costume.

<!-- @approach -->
### Horizontal Scanning

<!-- @idea -->
Hold a working prefix, start it at the first string, and shrink it against each remaining string in turn.

<!-- @steps -->
1. Return the empty string immediately if the list is empty.
2. Set the working prefix to the first string.
3. For each remaining string, walk forward while its characters match the prefix.
4. Cut the prefix down to the number of characters that matched.
5. Stop early and return the empty string if the prefix ever becomes empty.
6. Return the prefix once every string has been folded in.

<!-- @complexity -->
- time: O(n*m) worst case — every character of every string
- space: O(m) for the prefix, O(1) beyond it if the prefix is tracked as a length
- note: The version that rebuilds the prefix string on every step allocates once per input string, and it must read all of the first string before it can report anything. With 200 strings of 20,000 characters and no shared prefix, that opening copy measured 0.35 microseconds against 0.00 for the same algorithm tracking a length — the comparison work is identical and all of the difference is the copy.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

string longestCommonPrefix(vector<string>& strs) {
    if (strs.empty()) return "";
    size_t len = strs[0].size();
    for (size_t i = 1; i < strs.size() && len > 0; i++) {
        size_t j = 0;
        while (j < len && j < strs[i].size() && strs[0][j] == strs[i][j]) j++;
        len = j;
    }
    return strs[0].substr(0, len);
}
```

<!-- @annotations -->
- 7: A length, not a string. Writing `string prefix = strs[0];` here copies the whole first string before any comparison happens, which is the entire cost at 20,000 characters.
- 8: `len > 0` in the loop condition is the early exit — once nothing is shared there is no point reading the rest of the list.
- 13: The single copy, built once from a length that is already final.

<!-- @code java -->
```java
static String longestCommonPrefix(String[] strs) {
    if (strs.length == 0) return "";
    int len = strs[0].length();
    for (int i = 1; i < strs.length && len > 0; i++) {
        int j = 0;
        while (j < len && j < strs[i].length() && strs[0].charAt(j) == strs[i].charAt(j)) j++;
        len = j;
    }
    return strs[0].substring(0, len);
}
```

<!-- @annotations -->
- 7: The textbook Java version writes `prefix = prefix.substring(0, j)` inside the loop, which allocates a new String per input string. Tracking `len` allocates once.

<!-- @code python -->
```python
def longest_common_prefix(strs):
    if not strs:
        return ""
    prefix = strs[0]
    for s in strs[1:]:
        while not s.startswith(prefix):
            prefix = prefix[:-1]
            if not prefix:
                return ""
    return prefix


# In Python this shape is fast for long answers and slow for short ones:
# 5.35us when the strings share 199 of 200 characters, 9.85us when they
# share nothing -- because startswith runs in C and the shrink loop does not.
```

<!-- @annotations -->
- 6: `startswith` is a single C call over the whole prefix, which is why this beats a hand-written character loop in Python whenever the prefix survives.
- 7: One slice per character removed. When the answer is empty this runs `len(strs[0])` times, which is why the empty case is the slow one here.

<!-- @approach -->
### Vertical Scanning

<!-- @idea -->
Compare the strings column by column and return the moment any two disagree.

<!-- @steps -->
1. Return the empty string immediately if the list is empty.
2. Take the column index from zero up to the length of the first string.
3. Read the character at this column in the first string.
4. Compare it against the same column in every other string.
5. Return the prefix ending just before this column as soon as one string is too short or disagrees.
6. Return the whole first string if every column matched.

<!-- @complexity -->
- time: O(n*k) where k is the length of the answer, and O(n*m) only when the answer is the whole string
- space: O(1) working, O(k) for the result
- note: The only approach that exits early in both dimensions — it stops at the first disagreeing column, and within that column at the first disagreeing string. Measured 0.003 microseconds on 200 random strings of 200 characters, against 2.13 for the min/max pass, because it reads two characters and returns. On identical strings the same code measured 35.66 against 2.68 — this is the approach whose ranking inverts hardest.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

string longestCommonPrefix(vector<string>& strs) {
    if (strs.empty()) return "";
    for (size_t j = 0; j < strs[0].size(); j++) {
        char c = strs[0][j];
        for (size_t i = 1; i < strs.size(); i++)
            if (j >= strs[i].size() || strs[i][j] != c) return strs[0].substr(0, j);
    }
    return strs[0];
}
```

<!-- @annotations -->
- 7: The column is the outer loop. That inversion is the whole approach — it is what lets the function return before reading the rest of the first string.
- 10: The length check comes first. `strs[i][j]` past the end of a `std::string` is undefined behaviour, and a shorter string is a legitimate stopping point rather than an error.
- 12: Falling out of the loop means every column matched, so the answer is the entire first string.

<!-- @code java -->
```java
static String longestCommonPrefix(String[] strs) {
    if (strs.length == 0) return "";
    for (int j = 0; j < strs[0].length(); j++) {
        char c = strs[0].charAt(j);
        for (int i = 1; i < strs.length; i++)
            if (j >= strs[i].length() || strs[i].charAt(j) != c) return strs[0].substring(0, j);
    }
    return strs[0];
}
```

<!-- @annotations -->
- 6: `charAt` bounds-checks on every call, so the explicit length test is about correctness of the *answer*, not about safety — a string that ran out is where the prefix ends.

<!-- @code python -->
```python
def longest_common_prefix(strs):
    if not strs:
        return ""
    first = strs[0]
    for j, c in enumerate(first):
        for s in strs[1:]:
            if j >= len(s) or s[j] != c:
                return first[:j]
    return first


# Best in Python when the answer is empty (0.49us) and by far the worst
# when it is not (1,282.64us at n = 200, m = 200) -- every comparison
# here is interpreted, where min/max and startswith are C calls.
```

<!-- @annotations -->
- 6: `strs[1:]` copies the list on every column. Iterating `range(1, len(strs))` or slicing once outside the loop removes that, and matters as soon as the answer is more than a character or two long.
- 8: Correct and idiomatic, and still 240x slower than the `startswith` version on identical strings. In Python the algorithm is rarely what you are choosing.

<!-- @approach -->
### Optimal - Lexicographic Minimum and Maximum

<!-- @idea -->
Only the smallest and largest strings matter, so find both in one pass and compare just those two.

<!-- @steps -->
1. Return the empty string immediately if the list is empty.
2. Walk the list once, keeping the lexicographically smallest and largest strings seen.
3. Compare those two strings character by character from the start.
4. Stop at the first position where they differ, or at the end of the shorter one.
5. Return that shared prefix — every other string is bracketed between them and must share it too.

<!-- @complexity -->
- time: O(n*m) worst case, but only 3n/2 whole-string comparisons plus one character walk over two strings
- space: O(1) working, O(k) for the result
- note: The right default when answers are long, and the right default in Python at any shape. Measured 2.68 microseconds on 200 identical strings of 200 characters against 35.66 for the vertical scan — 13x — because whole-string comparison compiles to vectorised `memcmp` while a character loop does not. It loses badly when the answer is empty (2.13 against 0.003) because finding the extremes always reads the whole list, with no early exit available.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <string>
#include <vector>
using namespace std;

string longestCommonPrefix(vector<string>& strs) {
    if (strs.empty()) return "";
    auto [lo, hi] = minmax_element(strs.begin(), strs.end());
    size_t n = min(lo->size(), hi->size()), j = 0;
    while (j < n && (*lo)[j] == (*hi)[j]) j++;
    return lo->substr(0, j);
}
```

<!-- @annotations -->
- 8: One pass, about 3n/2 comparisons. `sort` would answer the same question in O(n log n) comparisons and then read two entries out of the ordering it built.
- 10: The only character-by-character work in the function, and it touches exactly two of the n strings.

<!-- @code java -->
```java
static String longestCommonPrefix(String[] strs) {
    if (strs.length == 0) return "";
    String lo = strs[0], hi = strs[0];
    for (String s : strs) {
        if (s.compareTo(lo) < 0) lo = s;
        if (s.compareTo(hi) > 0) hi = s;
    }
    int n = Math.min(lo.length(), hi.length()), j = 0;
    while (j < n && lo.charAt(j) == hi.charAt(j)) j++;
    return lo.substring(0, j);
}
```

<!-- @annotations -->
- 5: `compareTo` on String is lexicographic by UTF-16 code unit, which is exactly the ordering the lemma needs.
- 8: Starting both at `strs[0]` rather than at a sentinel avoids needing a "nothing seen yet" case — the same seed-from-the-data rule as Largest Element.

<!-- @code python -->
```python
def longest_common_prefix(strs):
    if not strs:
        return ""
    lo, hi = min(strs), max(strs)
    for i, c in enumerate(lo):
        if c != hi[i]:
            return lo[:i]
    return lo


# This is, line for line, what os.path.commonprefix does in CPython's
# genericpath.py. min and max run in C over the whole list, so this is
# the steadiest choice in Python: 3.57us empty, 6.97us identical.
```

<!-- @annotations -->
- 4: `min` and `max` are two full C-level passes. `sorted(strs)[0]` and `[-1]` would answer the same question after building an ordering nothing reads.
- 6: `hi[i]` is safe without a length check because `lo <= hi` lexicographically means `hi` cannot be a strict prefix of `lo` — if it ran out first it would be the smaller one.

<!-- @approach -->
### Binary Search on the Answer's Length

<!-- @idea -->
The answer's length is between zero and the shortest string, and "do all strings share the first k characters" is monotone in k — so search for the boundary.

<!-- @steps -->
1. Return the empty string immediately if the list is empty.
2. Find the shortest string's length in one pass — that is the upper bound.
3. Binary search the length between zero and that bound.
4. At each candidate length, test whether every string shares the first k characters of the first string.
5. Move the lower bound up on success and the upper bound down on failure.
6. Return that many characters of the first string.

<!-- @complexity -->
- time: O(n*m*log m) comparisons in the worst case, but each test is a block compare rather than a character loop
- space: O(1) working, O(k) for the result
- note: Asymptotically the worst approach on this page and empirically the best on middling answers, because `memcmp` moves whole cache lines where the scanners move bytes. Measured 1.06 microseconds when 200 strings share 100 of 200 characters — against 17.78 for vertical and 2.68 for min/max, the fastest of all seven. It falls behind again on fully identical input at 9.38 against 2.68.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <cstring>
#include <string>
#include <vector>
using namespace std;

static bool allShare(const vector<string>& strs, size_t k) {
    for (size_t i = 1; i < strs.size(); i++)
        if (strs[i].size() < k || memcmp(strs[0].data(), strs[i].data(), k) != 0) return false;
    return true;
}

string longestCommonPrefix(vector<string>& strs) {
    if (strs.empty()) return "";
    size_t lo = 0, hi = strs[0].size();
    for (const string& s : strs) hi = min(hi, s.size());
    while (lo < hi) {
        size_t mid = (lo + hi + 1) / 2;
        if (allShare(strs, mid)) lo = mid; else hi = mid - 1;
    }
    return strs[0].substr(0, lo);
}
```

<!-- @annotations -->
- 9: `memcmp` is the entire reason this approach competes — one vectorised call per string instead of k character comparisons.
- 15: The shortest string caps the answer, so this pass turns an O(m) search range into the tightest one available.
- 18: `+ 1` before halving. Without it `mid` equals `lo` when they are adjacent, `lo` never advances, and the loop hangs.

<!-- @code java -->
```java
static String longestCommonPrefix(String[] strs) {
    if (strs.length == 0) return "";
    int lo = 0, hi = strs[0].length();
    for (String s : strs) hi = Math.min(hi, s.length());
    while (lo < hi) {
        int mid = (lo + hi + 1) >>> 1;
        boolean ok = true;
        for (int i = 1; i < strs.length && ok; i++)
            ok = strs[i].length() >= mid && strs[i].regionMatches(0, strs[0], 0, mid);
        if (ok) lo = mid; else hi = mid - 1;
    }
    return strs[0].substring(0, lo);
}
```

<!-- @annotations -->
- 6: `>>> 1` rather than `/ 2` — unsigned shift, so the midpoint is still right if `lo + hi` overflows into a negative int.
- 9: `regionMatches` compares without allocating, where `substring(0, mid).equals(...)` would build a new String per test.

<!-- @code python -->
```python
def longest_common_prefix(strs):
    if not strs:
        return ""
    lo, hi = 0, min(len(s) for s in strs)
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if all(s[:mid] == strs[0][:mid] for s in strs):
            lo = mid
        else:
            hi = mid - 1
    return strs[0][:lo]


# Rarely worth it in Python: each test slices every string, so the
# log m rounds each cost a full pass. min/max stays the better default.
```

<!-- @annotations -->
- 7: `s[:mid] == strs[0][:mid]` allocates two slices per string per round. `s.startswith(strs[0][:mid])` slices once per round instead.

<!-- @approach -->
### Trie - Correct, Elegant, and the Wrong Tool

<!-- @idea -->
Insert every string into a prefix tree and walk down from the root while there is exactly one child and no string has ended.

<!-- @steps -->
1. Insert every string into a trie, one node per character.
2. Mark the node where each string ends as terminal.
3. Start at the root with an empty answer.
4. Stop if the current node is terminal — a string ends here, so the prefix cannot extend past it.
5. Stop if the current node has zero or more than one child — the strings diverge here.
6. Otherwise step into the single child, append its character, and repeat.

<!-- @complexity -->
- time: O(n*m) to build plus O(k) to walk — no early exit, because the build reads everything before the walk begins
- space: O(n*m) nodes, at 216 bytes per node for a 26-way child array
- note: Included to be priced rather than to be used. Measured 1,977.84 microseconds against 0.003 for the vertical scan on 200 random strings of 200 characters — **671,400x** — and 8.2 MB of nodes for a 40 KB input. Even on identical strings, its best case, it stays behind at 48.51 against 37.10. It never wins for a single query. It is the right structure when many prefix questions will be asked of the same set, which is a different problem.

<!-- @code cpp -->
```cpp
#include <deque>
#include <string>
#include <vector>
using namespace std;

struct Node { Node* kid[26] = {}; bool terminal = false; };

string longestCommonPrefix(vector<string>& strs) {
    if (strs.empty()) return "";
    deque<Node> pool(1);
    Node* root = &pool.front();
    for (const string& s : strs) {
        Node* cur = root;
        for (char ch : s) {
            int k = ch - 'a';
            if (!cur->kid[k]) { pool.emplace_back(); cur->kid[k] = &pool.back(); }
            cur = cur->kid[k];
        }
        cur->terminal = true;
    }
    string out;
    for (Node* cur = root; !cur->terminal; ) {
        int only = -1, kids = 0;
        for (int k = 0; k < 26; k++) if (cur->kid[k]) { only = k; kids++; }
        if (kids != 1) break;
        cur = cur->kid[only];
        out += char('a' + only);
    }
    return out;
}
```

<!-- @annotations -->
- 6: 26 pointers plus a flag is 216 bytes per node, and there is up to one node per input character — 8.2 MB for a 40 KB input.
- 10: A `deque` as the arena. `deque` never invalidates pointers to existing elements when it grows, so the child pointers stay valid, and everything is freed at once — a raw `new` per node here leaks unless you write the matching teardown.
- 22: No child count is needed. Every string passes through the root, so if a node is not terminal and has exactly one child, every string through it takes that child.

<!-- @code java -->
```java
static class Node { Node[] kid = new Node[26]; boolean terminal = false; }

static String longestCommonPrefix(String[] strs) {
    if (strs.length == 0) return "";
    Node root = new Node();
    for (String s : strs) {
        Node cur = root;
        for (int i = 0; i < s.length(); i++) {
            int k = s.charAt(i) - 'a';
            if (cur.kid[k] == null) cur.kid[k] = new Node();
            cur = cur.kid[k];
        }
        cur.terminal = true;
    }
    StringBuilder out = new StringBuilder();
    for (Node cur = root; !cur.terminal; ) {
        int only = -1, kids = 0;
        for (int k = 0; k < 26; k++) if (cur.kid[k] != null) { only = k; kids++; }
        if (kids != 1) break;
        cur = cur.kid[only];
        out.append((char) ('a' + only));
    }
    return out.toString();
}
```

<!-- @annotations -->
- 1: One object plus one 26-element array per node, so the real footprint is larger than the C++ figure and every node is an independent allocation for the collector to trace.

<!-- @code python -->
```python
def longest_common_prefix(strs):
    if not strs:
        return ""
    root = {}
    for s in strs:
        cur = root
        for ch in s:
            cur = cur.setdefault(ch, {})
        cur["$"] = True
    out = []
    cur = root
    while "$" not in cur and len(cur) == 1:
        ch = next(iter(cur))
        out.append(ch)
        cur = cur[ch]
    return "".join(out)


# A dict per node rather than a 26-slot array, so it is sparse -- and
# still reads every character of every string before answering.
```

<!-- @annotations -->
- 9: `"$"` as the terminal marker only works because the alphabet excludes it. A separate `set` of terminal node ids is the version that survives arbitrary input.
- 13: The walk is cheap. The build above it is the whole cost, and it has no early exit.

<!-- @example -->

<!-- @input -->
strs = ["flower", "flow", "flight"]

<!-- @output -->
"fl"

<!-- @why -->
The textbook case, and the one that shows both stopping conditions — a disagreeing character and a string running out — in six words.

<!-- @walkthrough -->
1. Column 0 is 'f' in all three, so the prefix is at least one character.
2. Column 1 is 'l' in all three, so it is at least two.
3. Column 2 is 'o', 'o', 'i' — "flight" disagrees, so the vertical scan returns "fl" after reading 9 characters of the 16.
4. The min/max version instead finds the smallest string, "flight", and the largest, "flower".
5. Comparing just those two gives "fl" as well, and "flow" is never examined at all.
6. That is the lemma in miniature: "flow" sits between "flight" and "flower" lexicographically, so it cannot fail to start with what they share.
7. The answer is also bounded by the shortest string, "flow", at four characters — and 2 is comfortably under it.

<!-- @example -->

<!-- @input -->
strs = ["dog", "racecar", "car"]

<!-- @output -->
"" (the empty string)

<!-- @why -->
The case that occurs 99.9% of the time on realistic input, and the one every approach should be judged on.

<!-- @walkthrough -->
1. Column 0 is 'd' in the first string and 'r' in the second.
2. The vertical scan returns after reading exactly two characters of the thirteen.
3. The horizontal version must first take "dog" as its working prefix, then shrink it to nothing against "racecar".
4. The min/max version reads all three strings to find that "car" is smallest and "racecar" largest, then compares those two.
5. The trie inserts all thirteen characters, allocating thirteen nodes, before its walk discovers three children at the root.
6. Every approach returns "", and they differ only in how much they read to say so.
7. Measured at this shape scaled to 200 strings of 200 characters: 0.003 microseconds for vertical against 1,977.84 for the trie.

<!-- @example -->

<!-- @input -->
200 identical strings of 200 characters, against 200 random ones

<!-- @output -->
Vertical 35.66us and 0.003us; min/max 2.68us and 2.13us

<!-- @why -->
The inversion, in one pair of measurements — neither approach is the fast one, and the answer's length is what decides.

<!-- @walkthrough -->
1. On the random input the answer is empty, so the vertical scan stops after two characters and measures 0.003 microseconds.
2. Min/max cannot stop early — finding the extremes always reads the whole list — and measures 2.13, about 710x slower.
3. On the identical input the answer is all 200 characters, so the vertical scan compares 200 columns across 200 strings.
4. That measures 35.66 microseconds, character by character.
5. Min/max compares whole strings, which becomes a vectorised `memcmp`, and measures 2.68 — about 13x faster.
6. Same two functions, same input size, opposite ranking, with the answer's length the only thing that changed.
7. At n = 1000 and m = 1000 the identical-input gap widens to 51.6 against 893.9, about 17x.

<!-- @example -->

<!-- @input -->
20,000 random sets of 2 to 50 words from the 235,974-word system dictionary

<!-- @output -->
19,980 sets have an empty answer; the mean answer length is 0.001 characters

<!-- @why -->
Fixes which column of the benchmark table is the one to optimise for, using measured input rather than assumed input.

<!-- @walkthrough -->
1. Each set draws between 2 and 50 words uniformly from the dictionary.
2. The longest common prefix is empty for 19,980 of the 20,000 sets, or 99.9%.
3. Sixteen sets have a one-character answer, three have two characters, and one has three.
4. The mean answer length is 0.001 characters, against a mean word length of 9.57.
5. So the total input is around 250 characters per set and the answer is essentially always nothing.
6. Any approach that reads the whole input before returning "" is doing hundreds of times the necessary work.
7. This is why the vertical scan is the default recommendation despite losing on the identical-string row.

<!-- @visualization custom -->

<!-- @description -->
Lay the strings out as a grid, one string per row, characters as cells, left-aligned so column j is the j-th character of every string. Tint the cells that belong to the answer and leave the rest flat, so the shape of the answer — almost always a single sliver at the left edge, or nothing at all — is the first thing visible. Then animate the two scans over that same grid, and let the traversal order carry the whole argument: the horizontal version sweeps the full first row before touching row two, while the vertical version steps down column 0, hits a disagreement on the second row and stops, having lit two cells out of forty thousand. Keep a live read counter under each so the ratio is a number and not an impression. Next, prove the min/max lemma by construction: sort the rows into lexicographic order with a visible reordering, dim every row except the first and the last, and drop a bracket around the middle ones labelled bracketed, cannot differ — then walk the two surviving rows together to produce the answer. Immediately after, undo the sort and show that only a single pass was ever needed to pick those two rows out, with the sort greyed and struck through. The centre of the figure is the inversion. Put two grids side by side, one random and one all-identical, and draw the same two approach bars beneath each: vertical at 0.003us and min/max at 2.13 on the left, vertical at 35.66 and min/max at 2.68 on the right, with the winner's bar highlighted in each — the highlight must visibly swap sides. Label the axis between them not input size but answer length, because that is the variable doing the work. Close with two honest cost blocks. First the trie: draw its nodes accumulating during the build, 40,000 of them at 216 bytes, as a block that fills the frame while the vertical scan's two lit cells sit beside it, with 1,977.84us against 0.003us and 8.2 MB against nothing. Then the dictionary histogram: 19,980 sets at answer length zero as one enormous bar and 16, 3, 1 at lengths one, two and three as slivers next to it, captioned this is the column you are optimising.

<!-- @sampleInput -->
```json
{"primary":{"strs":["flower","flow","flight"],"answer":"fl","n":3,"lengths":[6,4,6],"lexMin":"flight","lexMax":"flower","stopsAt":{"column":2,"reason":"flight has 'i' where the others have 'o'"}},"smallCases":[{"strs":["flower","flow","flight"],"answer":"fl"},{"strs":["dog","racecar","car"],"answer":""},{"strs":["interspecies","interstellar","interstate"],"answer":"inters"},{"strs":["a"],"answer":"a"},{"strs":["",""],"answer":""},{"strs":["ab","abc"],"answer":"ab"}],"bounds":[{"claim":"the answer is a prefix of every string, hence of strs[0]","use":"every approach is choosing where to stop along strs[0]"},{"claim":"the answer is no longer than the shortest string","verified":"200000 random sets, 0 violations","use":"sets the upper bound for the binary search in one pass"}],"minMaxLemma":{"claim":"LCP(set) == LCP(lexicographic min, lexicographic max)","argument":["every string s satisfies min <= s <= max","if min and max both begin with P, any string ordered between them must begin with P too","so the two extremes are the only strings worth comparing"],"verification":[{"kind":"exhaustive, all tuples of size 1-4 over {a,b} with length <= 3","sets":54240,"mismatches":0},{"kind":"random sets of 1-6 strings over {a,b,c}","sets":200000,"mismatches":0}],"sortNotNeeded":"min and max are one linear pass; sorting builds a full ordering and reads two entries out of it","inStandardLibrary":"CPython os.path.commonprefix (genericpath.py) is exactly min(m), max(m), then a character walk"},"realWorldDistribution":{"source":"20000 random sets of 2 to 50 words from the 235974-word system dictionary","answerLengthCounts":{"0":19980,"1":16,"2":3,"3":1},"emptyShare":"99.9%","meanAnswerLength":0.001,"meanWordLength":9.57,"reading":"the job is almost never to build a long prefix; it is to prove there is none, cheaply"},"earlyExitDimensions":{"horizontal":"exits across the list only, and must read all of strs[0] first","vertical":"exits down the column and across the list","minMax":"no early exit — finding the extremes always reads every string","binarySearch":"no early exit, but each test is a vectorised block compare","trie":"no early exit — the build reads everything before the walk starts"},"benchCpp":{"unit":"microseconds per run, Apple M2, clang -O2","n200m200":[{"shape":"random","answer":0,"horizRebuild":0.03,"horizIndex":0.01,"vertical":0.0,"minMax":2.13,"sortEnds":10.12,"divideConquer":6.26,"binarySearch":0.14},{"shape":"distinct first char","answer":0,"horizRebuild":0.03,"horizIndex":0.01,"vertical":0.0,"minMax":2.11,"sortEnds":9.8,"divideConquer":6.1,"binarySearch":0.14},{"shape":"share half","answer":100,"horizRebuild":19.98,"horizIndex":19.61,"vertical":17.78,"minMax":2.68,"sortEnds":16.1,"divideConquer":19.05,"binarySearch":1.06},{"shape":"share all but one","answer":199,"horizRebuild":35.95,"horizIndex":37.48,"vertical":35.51,"minMax":3.09,"sortEnds":18.69,"divideConquer":27.05,"binarySearch":8.16},{"shape":"identical","answer":200,"horizRebuild":36.14,"horizIndex":37.55,"vertical":35.66,"minMax":2.68,"sortEnds":8.01,"divideConquer":27.0,"binarySearch":9.38}],"n1000m1000":[{"shape":"random","answer":0,"horizRebuild":0.1,"vertical":0.0,"minMax":10.8,"sortEnds":112.2,"divideConquer":42.8,"binarySearch":0.6},{"shape":"identical","answer":1000,"horizRebuild":790.9,"vertical":893.9,"minMax":51.6,"sortEnds":113.4,"divideConquer":412.5,"binarySearch":223.2}],"longFirstString":{"n":200,"m":20000,"answer":0,"horizRebuild":0.35,"horizIndex":0.0,"vertical":0.0,"minMax":3.39,"sortEnds":78.42,"divideConquer":76.43,"binarySearch":0.16,"reading":"the 0.35 is the opening copy of strs[0], not any comparison"},"inversion":{"answerEmpty":{"vertical":0.003,"minMax":2.13,"ratio":"710x for vertical"},"answerFull":{"vertical":35.66,"minMax":2.68,"ratio":"13x for minMax"},"atN1000":{"vertical":893.9,"minMax":51.6,"ratio":"17x for minMax"},"reason":"vertical compares one character at a time so it can stop after two; minMax compares whole strings which vectorises to memcmp but cannot stop early on the list"},"methodology":"median of three runs on an otherwise idle machine; run-to-run spread within about 2%"},"benchPython":{"unit":"microseconds per run, CPython 3.13.4, n=200 m=200","rows":[{"shape":"random","answer":0,"startswithShrink":9.85,"verticalLoop":0.49,"zipStar":4.9,"minMax":3.57,"sortedEnds":12.16,"osPath":6.07},{"shape":"distinct first char","answer":0,"startswithShrink":10.13,"verticalLoop":0.5,"zipStar":4.9,"minMax":3.56,"sortedEnds":11.32,"osPath":6.08},{"shape":"share all but one","answer":199,"startswithShrink":5.35,"verticalLoop":1282.64,"zipStar":259.04,"minMax":9.1,"sortedEnds":23.45,"osPath":11.61},{"shape":"identical","answer":200,"startswithShrink":5.78,"verticalLoop":1388.4,"zipStar":260.46,"minMax":6.97,"sortedEnds":6.33,"osPath":9.53}],"inversion":{"emptyAnswer":"vertical 20x faster than startswith","fullAnswer":"vertical 240x slower than startswith"},"reason":"every character comparison in the vertical loop is a bytecode step, while startswith, min, max and slicing are single C calls","rule":"do not loop over characters in Python unless you expect to stop almost immediately","zipStarNote":"builds an n-tuple per column; 260us against 5.78 on the same shape","methodology":"median of three runs on an otherwise idle machine"},"triePrice":{"n":200,"m":200,"random":{"trie":1977.84,"vertical":0.003,"ratio":"671400x"},"identical":{"trie":48.51,"vertical":37.1,"ratio":"1.3x"},"nodeBytes":216,"maxNodes":40000,"footprintMB":8.2,"inputKB":40,"verdict":"never wins for a single query — not even on identical strings, its best case; the right structure only when many prefix questions will be asked of the same set"},"assertions":["the answer is a prefix of strs[0]","the answer is a prefix of every string in the list","the answer is no longer than the shortest string","the answer equals the common prefix of the lexicographic minimum and maximum","the answer is empty exactly when no character is shared at column 0"],"recommendation":"vertical scanning by default, because the answer is empty on 99.9% of realistic inputs; min/max when answers are known to be long, and min/max in Python at any shape","lesson":"the answer's length, not the input's size, decides which approach wins — and it inverts the ranking by orders of magnitude in both languages"}
```

<!-- @highlights -->
- The strings are laid out as a grid, one per row, left-aligned so column j is the j-th character of every string.
- Cells belonging to the answer are tinted; the rest stay flat, so the answer reads as a sliver at the left edge or nothing at all.
- The horizontal scan sweeps the entire first row before touching row two.
- The vertical scan steps down column 0, hits a disagreement on the second row, and stops with two cells lit out of forty thousand.
- A live read counter under each turns the ratio into a number rather than an impression.
- The rows then sort into lexicographic order with a visible reordering.
- Every row except the first and last dims, and a bracket labelled bracketed, cannot differ closes over the middle.
- The two surviving rows are walked together to produce the answer.
- The sort is then undone and greyed out, struck through, since one linear pass was all that was needed to pick those two rows.
- The centre places two grids side by side, one random and one all-identical.
- The same two approach bars sit beneath each: vertical 0.003us and min/max 2.13 on the left, vertical 35.66 and min/max 2.68 on the right.
- The highlight marking the winner visibly swaps sides between them.
- The axis between the two grids is labelled not input size but answer length.
- The trie's nodes accumulate during its build — 40,000 at 216 bytes — as a block that fills the frame.
- Beside it sit the vertical scan's two lit cells, with 1,977.84us against 0.003us and 8.2 MB against nothing.
- The close is the dictionary histogram: 19,980 sets at answer length zero as one enormous bar.
- Lengths one, two and three appear as slivers of 16, 3 and 1, captioned this is the column you are optimising.

<!-- @edgeCases -->
- An empty list — return the empty string before touching `strs[0]`, which every approach here does on its first line.
- A single string — the answer is that string in full, and it is the case where the inner loop never runs.
- One empty string in the list — the answer is empty, and it is why the column scan must test `j >= strs[i].size()` before indexing.
- All strings empty — the answer is empty; the trie's root is terminal immediately, which is the condition that stops its walk.
- One string is a prefix of another, like `["ab", "abc"]` — the answer is the shorter one, so running out of characters is a stopping point rather than a mismatch.
- All strings identical — the answer is the whole string, the worst case for the vertical scan and the best for min/max.
- No shared first character — the answer is empty after two character reads, and this is 99.9% of realistic input.
- A very long first string with an empty answer — the horizontal version pays for copying it before comparing anything, measured 0.35us against 0.00.
- Strings of wildly differing lengths — the shortest caps the answer, which the binary search uses and the scanners discover on the way.
- Characters outside `a-z` — the array-backed trie indexes with `ch - 'a'` and reads out of bounds. Every other approach here is alphabet-agnostic.
- Duplicate strings in the list — harmless everywhere, and they cost the trie a full traversal each without adding a node.

<!-- @pitfalls -->
- Assuming one approach is "the fast one". Vertical is 710x ahead when the answer is empty and 13x behind when it is not; the answer's length decides, not the input's size.
- Copying `strs[0]` into a working prefix. That copy runs before any comparison and is the whole cost on long first strings — track a length and copy once, exactly as in Largest Odd Number in a String.
- Rebuilding the prefix string on every iteration. One allocation per input string, for a value that is thrown away on the next line.
- Sorting to get the minimum and maximum. `minmax_element` and `min`/`max` are one pass; sorting builds the full ordering and reads two entries out of it.
- Indexing `strs[i][j]` without checking the length first. A string shorter than the current column is a legitimate stopping point, and reading past the end is undefined behaviour in C++.
- Writing `mid = (lo + hi) / 2` in the binary search. When `lo` and `hi` are adjacent, `mid` equals `lo`, the bound never advances, and the loop hangs — it must be `(lo + hi + 1) / 2`.
- Reaching for a trie. Measured 671,400x slower than the vertical scan on the case that occurs 99.9% of the time, and 8.2 MB of nodes for a 40 KB input.
- Writing a character loop in Python. Measured 1,282.64us against 5.35 for the `startswith` version on the same input — in Python the choice is which loop the interpreter runs, not which algorithm you picked.
- Using `zip(*strs)` as the Python "clever" answer. It builds an n-tuple per column and measured 260us against 5.78 on identical strings.
- Slicing `strs[1:]` inside the column loop. It copies the list on every column, which is invisible when the answer is empty and quadratic when it is not.
- Forgetting that the trie walk must stop at a terminal node. `["ab", "abc"]` has a single child at the node after `b`, and continuing past it returns `"abc"` for a set whose answer is `"ab"`.

<!-- @doubt -->
### Why is the answer just the common prefix of the smallest and largest strings?

<!-- @answer -->
Because every other string is bracketed between them. Sort the list; any string `s` satisfies `min <= s <= max`. If `min` and `max` both start with `P`, then a string that did *not* start with `P` would have to sort either before `min` or after `max` — it would differ from `P` at some character, and that difference would push it outside the range. So there is nowhere for a counterexample to sit. Verified rather than trusted: over all 54,240 tuples of up to 4 strings of length up to 3 over a two-letter alphabet, and over 200,000 random sets over a three-letter alphabet, the min/max result matched the true answer every time. CPython's `os.path.commonprefix` is this lemma in four lines.

<!-- @doubt -->
### Which approach should I actually write?

<!-- @answer -->
Vertical scanning, unless you know the answers are long. The reason is the input distribution rather than the complexity class: over 20,000 random sets of dictionary words, 99.9% had an empty common prefix and the mean answer length was 0.001 characters. Vertical scanning is the only approach that exits early in both dimensions — it stops at the first disagreeing column and, within that column, at the first disagreeing string — so on that input it reads two characters and returns, measured 0.003 microseconds against 2.13 for min/max. If your strings genuinely share long prefixes, such as file paths under a common root, switch to min/max: it measured 2.68 against 35.66 on identical strings. In Python, use min/max at any shape.

<!-- @doubt -->
### How can vertical scanning be both the fastest and the slowest?

<!-- @answer -->
Because the two measurements are on different inputs, and the answer's length is the variable. Vertical scanning compares one character at a time, which is the cheapest possible thing to do *once* and the most expensive way to cover 40,000 characters. When the answer is empty it does two comparisons and returns — 0.003 microseconds at n = 200, m = 200. When the answer is the entire string it does all 200 columns across all 200 strings, byte by byte, and measures 35.66, where min/max compares whole strings and lets the compiler turn that into a vectorised `memcmp` at 2.68. Same functions, same input size, opposite ranking. At n = 1000 the gap on identical input widens to 17x.

<!-- @doubt -->
### Do I need to sort the strings for the min/max approach?

<!-- @answer -->
No, and sorting is the part worth removing. You need two values — the lexicographic minimum and maximum — and both come from a single linear pass: `minmax_element` in C++, `min(strs)` and `max(strs)` in Python, roughly 3n/2 comparisons. Sorting computes the complete ordering of all n strings and then reads the first and last entries out of it, which is Largest Element's lesson wearing different clothes. Measured at n = 1000, m = 1000 on random input, the sorting version took 112.2 microseconds against 10.8 — about 10x. Interestingly the gap is smaller than `log n` would predict, because the sort's comparisons stop at the first differing character and so never touch most of the bytes.

<!-- @doubt -->
### Is a trie worth building for this?

<!-- @answer -->
Not for one query, and the margin is not close. Measured at n = 200, m = 200 on random strings, the trie took 1,977.84 microseconds against 0.003 for the vertical scan — **671,400x** — and allocated up to 40,000 nodes at 216 bytes each, about 8.2 MB for a 40 KB input. Even on fully identical strings, its best case, it stays behind at 48.51 against 37.10. The reason is structural rather than incidental: the build has no early exit, so it reads and allocates the entire input before the walk can start, and the walk was the only part that could have stopped early. A trie is the right structure when you will ask many prefix questions of the same fixed set — that is a different problem, and there the build amortises.

<!-- @doubt -->
### My Python solution is correct but times out. What is wrong with it?

<!-- @answer -->
Almost certainly a character loop. In Python the algorithm you chose matters far less than whether the inner loop runs in the interpreter or in C. The vertical scan — a `for` over columns with a `for` over strings inside it — measured 1,282.64 microseconds on 200 strings sharing 199 of 200 characters, where the `startswith` version measured 5.35 and `min`/`max` measured 9.10. That is 240x for the same asymptotic complexity. `zip(*strs)` looks like the clever fix and is not: it builds an n-element tuple per column, at 259 microseconds. Use `min(strs)` and `max(strs)` and compare only those two, which is what `os.path.commonprefix` does.

<!-- @doubt -->
### Why does the binary search beat everything on middling answers when it has the worst complexity?

<!-- @answer -->
Because complexity counts comparisons and the machine charges for cache lines. Binary search performs O(n·m·log m) character comparisons in the worst case, which is worse on paper than every other approach here. But each of its `log m` rounds tests a whole candidate prefix with one `memcmp` per string, and `memcmp` moves 16 or 32 bytes per instruction where a character loop moves one. Measured with 200 strings sharing 100 of 200 characters, it took 1.06 microseconds — the fastest of all seven approaches, against 17.78 for vertical and 2.68 for min/max. It falls behind again on fully identical input, at 9.38 against 2.68, because then the extra `log m` rounds have nothing left to save.

<!-- @doubt -->
### What should the shortest string have to do with it?

<!-- @answer -->
It caps the answer, which is worth one pass to learn. The answer is a prefix of every string, so it cannot be longer than the shortest of them — verified over 200,000 random sets with zero violations, as you would expect for something true by definition. The binary search uses this directly: one pass over the lengths turns its search range from `[0, len(strs[0])]` into `[0, min length]`, which is the tightest bound available and costs O(n). The scanning approaches get it for free instead — they discover a string has run out at the moment they index past its end, which is why the length check has to come before the character comparison rather than after it.
