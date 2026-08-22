---
id: check-if-two-strings-are-anagram-of-each-other
topic: Strings
title: Check if two strings are anagram of each other
difficulty: Easy
status: ready
prerequisites:
  - for-loop
  - if-else-statements
  - data-types
  - isomorphic-string
  - sort-an-array-of-0s-1s-and-2s
  - time-and-space-complexity-basics
relatedIds:
  - sort-characters-by-frequency
  - isomorphic-string
  - rotate-string
  - sort-an-array-of-0s-1s-and-2s
  - count-number-of-substrings
---

<!-- @summary -->
Decide whether two strings contain the same characters in a different order — where the answer is exactly equality of the character-count vector, and every popular shortcut is a **lossy compression** of that vector with a measurable price: at length 5 over a five-letter alphabet the count vector separates all 126 anagram classes, the character sum collapses them to 21 and is wrong on 7.47% of pairs, XOR collapses them to 8 and is wrong on 11.27%, and the prime product is exact but overflows a 64-bit integer after 9 characters against a 50,000-character limit.

<!-- @theory -->
## The problem

Two strings are anagrams if one is a rearrangement of the other — same
characters, same number of each, any order.

```
"anagram"  "nagaram"   ->  true
"rat"      "car"       ->  false
"aacc"     "ccac"      ->  false    three c's against two
"ab"       "ab"        ->  true     zero rearrangement counts
```

The standard constraint puts the length at up to 50,000 and, in the usual
statement, restricts the characters to lowercase English letters. That second
half of the constraint is the one worth reading twice, because most solutions
silently depend on it.

## The answer is the count vector, exactly

For each character, count how many times it appears. Two strings are anagrams
**exactly when those counts agree for every character**. Nothing else is needed
and nothing less will do.

```
"aacc"   ->  a:2  c:2
"ccac"   ->  a:1  c:3        different, so not anagrams
```

That count vector is a **perfect fingerprint** for the property. Over every
ordered pair of length-5 strings on a five-letter alphabet — 9,765,625 pairs —
there are exactly 126 genuine anagram classes, and the count vector distinguishes
all 126 of them with zero collisions.

Sorting is the same fact in another costume: the sorted string is a
canonical form for the multiset, so `sorted(s) == sorted(t)` is exactly correct
too — zero mismatches on the same 9,765,625 pairs. It just pays O(n log n) to
learn what counting learns in O(n).

## Every shortcut is a lossy compression, and here is the exact loss

The count vector is a vector. The tempting shortcuts replace it with a single
number, and a single number cannot carry as much information. This is measurable
rather than arguable.

Over all strings of length 5 on the alphabet `{a,b,c,d,e}`:

| Fingerprint | Distinct values it can take | Anagram classes it separates |
|---|---|---|
| **Count vector** | **126** | **126 of 126** |
| Character sum | 21 | 21 of 126 |
| XOR of characters | **8** | 8 of 126 |

126 classes cannot be told apart by 8 values. The failures follow directly:

| Length | Ordered pairs | Char-sum wrong | XOR wrong |
|---|---|---|---|
| 3 | 15,625 | 1,206 (**7.72%**) | 1,500 (**9.60%**) |
| 4 | 390,625 | 30,280 (7.75%) | 41,764 (10.69%) |
| 5 | 9,765,625 | 729,040 (7.47%) | 1,100,180 (**11.27%**) |

The counterexamples are tiny. For the sum, `"aac"` and `"abb"` — both total the
same because `a + c == b + b`. For XOR, `"aaa"` and `"abb"` — the repeated pair
cancels, so any string XORs equal to itself with a doubled character bolted on.
XOR is the worse of the two and does not improve with length: it stays at 8
distinct values at every size, because the reachable values form a small closed
set under XOR.

## The prime product is exact and still unusable

Map each letter to a prime and multiply. Two multisets have the same product
exactly when they are the same multiset — that is the fundamental theorem of
arithmetic, and it is genuinely correct. Zero mismatches on every pair tested.

Then count the digits:

| Input | Characters before a signed 64-bit overflow |
|---|---|
| All `a` (prime 2) | 62 |
| All `m` (prime 41) | 11 |
| All `z` (prime 101) | **9** |
| Random lowercase text | as few as **10** |

Against a stated limit of 50,000 characters. The prime product is a correct
algorithm for strings of about ten letters, which is not the problem. Arbitrary
precision integers fix the overflow and replace an O(n) scan with O(n)
multiplications on a number thousands of digits long — correct, and slower than
sorting.

## The alphabet assumption is where the real bug lives

`int count[26]` with `count[c - 'a']` is the standard solution, and it is only
correct for lowercase ASCII. Anything else indexes out of bounds:

| Character | `c - 'a'` |
|---|---|
| `a` | 0 |
| `z` | 25 |
| `A` | **-32** |
| `Z` | **-7** |
| `0` | **-49** |
| space | **-65** |
| `é` (first UTF-8 byte) | **136** |

Negative subscripts and reads past the end, silently, with no crash to tell you.
An uppercase letter or a single space is enough.

The fix costs nothing measurable. Index a 256-entry table by the raw byte
instead:

| n = 50,000 | Microseconds |
|---|---|
| 26-entry table, `c - 'a'` | 49.77 |
| **256-entry table, raw byte** | **50.46** |

Within noise of each other. **Use 256.** It is the same speed, it is correct on
arbitrary bytes, and it removes an assumption you would otherwise have to
document. For text beyond one byte per character, count code points in a hash
map — which costs about 4x, measured at 215.63 against 49.77.

## Counting beats sorting, by about an order of magnitude

Same problem, two canonical forms:

| n | Sort both | One count table | Ratio |
|---|---|---|---|
| 10 | 0.044us | 0.017us | 2.6x |
| 100 | 0.912us | 0.120us | 7.6x |
| 1,000 | 10.056us | 1.146us | 8.8x |
| 10,000 | 92.391us | 11.697us | 8.3x |
| 50,000 | 584.231us | 55.418us | **10.5x** |

Roughly 8-10x from n = 100 upward, and only 2.6x at n = 10 where the sort has
almost nothing to do. The gap is the `log n` factor plus the fact that counting
is a linear scan over a table small enough to stay in L1 while sorting moves the
data itself.

## One table, not two

Counting `s` up and `t` down into a single table is the same work with half the
memory traffic — and at the end every entry must be zero:

| n = 50,000, true anagram | Microseconds |
|---|---|
| Two tables, compared with `memcmp` | 49.77 |
| **One table, increment then decrement** | **49.08** |

Marginal, but it is free and it reads better. The real reason to prefer it is the
next section.

## The early exit is a real trade, and it halves the work at best

With one table you can bail the moment a count goes negative — that character
appears more often in `t` than in `s`, so the answer is already `false`.

Measured at n = 50,000, on input whose first character of `t` never occurs in `s`
at all:

| | Anagram (exit never fires) | First character absent (exit fires immediately) |
|---|---|---|
| One table, no early exit | 49.08us | 48.82us |
| One table, early exit | 55.88us | **24.63us** |
| 256-entry table, early exit | 50.46us | **19.15us** |

It costs about **14%** on inputs where it never fires and saves about **55%**
when it fires on the first character. Note the ceiling: even an immediate exit
only halves the runtime, because the first pass over `s` is unconditional. There
is no version of this that returns in constant time.

## Python: the length guard is worth 22,900x

`Counter(s) == Counter(t)` is the idiomatic answer and it is correct. But
`Counter` builds both tables in full before comparing them, so on strings of
different lengths it does all the work and then discovers the answer was
available from `len`.

Measured, microseconds:

| Shape, n = 50,000 | `sorted` | `Counter` | `len` + `Counter` | dict loop |
|---|---|---|---|---|
| True anagram | 7,961.46 | 2,291.16 | 2,319.08 | 4,468.89 |
| Differs at the last character | 7,958.68 | 2,243.68 | 2,241.40 | 4,433.34 |
| First character of `t` absent from `s` | 7,934.65 | 2,312.57 | 2,287.74 | **1,926.33** |
| **Different lengths** | 7,905.82 | 2,290.12 | **0.10** | **0.18** |

**2,290.12 microseconds against 0.10 — about 22,900x — for one comparison put in
front.** Unlike the guards in **Isomorphic String** and **Rotate String**, this
one is not about correctness: `Counter(s) == Counter(t)` already returns `False`
for different lengths. It is purely about not doing 100,000 characters of work to
learn something `len` knew immediately.

Two other readings from that table. `sorted` is about 3.5x slower than `Counter`
at this size, though at n = 100 they are within noise (8.49 against 7.71) — at
small sizes in Python, pick whichever reads better. And the hand-written dict
loop is 2x slower than `Counter` on true anagrams but the **fastest** thing on
the page when it can exit early, at 1,926.33 — the same early-exit trade as C++,
with a much larger constant.

## What to write

`len(s) == len(t)` first, then a single 256-entry table indexed by raw byte,
incremented over `s` and decremented over `t`, bailing on a negative. In Python,
`len(s) == len(t) and Counter(s) == Counter(t)`. Reach for a hash map only when
the characters are not bytes.

<!-- @intuition -->
The property being tested is equality of multisets, and a multiset of characters over a fixed alphabet is just a short vector of counts — twenty-six numbers, or two hundred and fifty-six, regardless of whether the strings are ten characters or fifty thousand. That is the whole idea: you can compare two arbitrarily long strings through a fingerprint of fixed size, and the fingerprint is small enough to sit in cache while the strings stream past it. What makes this problem instructive is the pull toward compressing that fingerprint further, into a single number you can add up or XOR together. It looks like the same move — replace the objects with a summary — but it is a categorically different one, because the count vector is a *complete* summary and a single integer is not. The measurement makes the difference concrete rather than theoretical: a hundred and twenty-six distinct anagram classes cannot be distinguished by a fingerprint that only takes eight values, and no amount of cleverness in how you combine the characters will change that. The lesson generalises past anagrams. When you replace a structure with a summary, the question is not whether the summary is fast but whether it is injective, and that question has an answer you can count.

<!-- @approach -->
### Sort Both and Compare

<!-- @idea -->
The sorted string is a canonical form for the multiset, so two strings are anagrams exactly when their sorted forms match.

<!-- @steps -->
1. Return false if the lengths differ.
2. Sort a copy of the first string.
3. Sort a copy of the second string.
4. Compare the two sorted strings for equality.
5. Return the result.

<!-- @complexity -->
- time: O(n log n) — dominated by the two sorts
- space: O(n) for the copies, or O(1) extra if sorting in place is allowed
- note: Exactly correct — zero mismatches over 9,765,625 exhaustive pairs — and the shortest thing to write, which makes it a good reference implementation to check the fast ones against. Measured 584.231 microseconds at n = 50,000 against 55.418 for a single count table, about 10.5x, narrowing to 2.6x at n = 10 where the sort barely runs. It also needs no assumption about the alphabet, which is the one thing it has over a 26-entry table.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <string>
using namespace std;

bool isAnagram(string s, string t) {
    if (s.size() != t.size()) return false;
    sort(s.begin(), s.end());
    sort(t.begin(), t.end());
    return s == t;
}
```

<!-- @annotations -->
- 5: Taking the strings by value is deliberate here — sorting mutates, and a caller rarely wants its arguments rearranged. That copy is the O(n) space.
- 6: The length check is an optimisation rather than a correctness fix here, since two sorted strings of different lengths compare unequal anyway.

<!-- @code java -->
```java
static boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    char[] a = s.toCharArray(), b = t.toCharArray();
    Arrays.sort(a);
    Arrays.sort(b);
    return Arrays.equals(a, b);
}
```

<!-- @annotations -->
- 6: `Arrays.equals`, not `==`. Comparing two arrays with `==` tests references and is false for every input.

<!-- @code python -->
```python
def is_anagram(s, t):
    return sorted(s) == sorted(t)


# Correct with no length check, since lists of different lengths are
# never equal. Measured 7,961.46us at n = 50,000 against 2,291.16 for
# Counter -- but at n = 100 they are within noise, 8.49 against 7.71.
```

<!-- @annotations -->
- 2: `sorted` returns a list of characters, so this compares lists rather than strings. `"".join(sorted(s))` is the same answer with an extra pass.

<!-- @approach -->
### Two Count Tables

<!-- @idea -->
Count each character in both strings and compare the two tables.

<!-- @steps -->
1. Return false if the lengths differ.
2. Create two zeroed tables, one entry per possible character.
3. Walk the first string, incrementing its table.
4. Walk the second string, incrementing its table.
5. Compare the two tables entry by entry.
6. Return whether every entry matched.

<!-- @complexity -->
- time: O(n) — two linear passes plus a fixed-size comparison
- space: O(1) — the table size depends on the alphabet, not the input
- note: The direct expression of "anagrams are equal count vectors", and the one to reason from. Measured 49.77 microseconds at n = 50,000. The table comparison is a fixed 104 or 1,024 bytes no matter how long the strings are, which is the property worth noticing: two 50,000-character strings are compared through a fingerprint that fits in a cache line or two.

<!-- @code cpp -->
```cpp
#include <cstring>
#include <string>
using namespace std;

bool isAnagram(const string& s, const string& t) {
    if (s.size() != t.size()) return false;
    int a[256] = {0}, b[256] = {0};
    for (unsigned char c : s) a[c]++;
    for (unsigned char c : t) b[c]++;
    return memcmp(a, b, sizeof a) == 0;
}
```

<!-- @annotations -->
- 7: 256 entries indexed by the raw byte, not 26 indexed by `c - 'a'`. Measured the same speed — 50.46 against 49.77 — and correct for uppercase, digits, spaces and every other byte.
- 8: `unsigned char` in the loop variable. A plain `char` is signed here, so any byte above 127 would index at a negative offset.
- 10: One `memcmp` over a fixed 1,024 bytes, whatever the input length.

<!-- @code java -->
```java
static boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] a = new int[256], b = new int[256];
    for (int i = 0; i < s.length(); i++) {
        a[s.charAt(i)]++;
        b[t.charAt(i)]++;
    }
    return Arrays.equals(a, b);
}
```

<!-- @annotations -->
- 3: 256 entries covers Latin-1 only. A Java `char` is a UTF-16 code unit, so text outside that range needs 65,536 entries or a map, and characters outside the Basic Multilingual Plane need code points rather than `char`.
- 5: Both strings are counted in one loop because the length check above guarantees they are the same length.

<!-- @code python -->
```python
from collections import Counter


def is_anagram(s, t):
    return len(s) == len(t) and Counter(s) == Counter(t)


# The len() guard is worth 22,900x on unequal-length input -- 0.10us
# against 2,290.12 at n = 50,000 -- because Counter builds both tables
# in full before it ever compares them.
```

<!-- @annotations -->
- 5: The guard is not a correctness fix; `Counter(s) == Counter(t)` already returns False for different lengths. It exists so the work is never started.

<!-- @approach -->
### Optimal - One Table, Increment Then Decrement

<!-- @idea -->
Count the first string up and the second string down into the same table, and bail the moment an entry goes negative.

<!-- @steps -->
1. Return false if the lengths differ.
2. Create one zeroed table with an entry per possible byte.
3. Walk the first string, incrementing its entry.
4. Walk the second string, decrementing its entry.
5. Return false immediately if any decrement takes an entry below zero.
6. Return true if the second walk completes.

<!-- @complexity -->
- time: O(n) worst case, and as little as O(n) on the first pass plus O(1) on the second when the exit fires early
- space: O(1) — one fixed table
- note: The version to write. Half the memory traffic of two tables and no final comparison pass, measured 49.08 microseconds at n = 50,000 against 49.77. The early exit is a genuine trade: about 14% slower when it never fires (55.88 against 49.08) and about 55% faster when it fires on the first character (24.63). Note the ceiling — even an immediate exit only halves the runtime, because the pass over the first string is unconditional.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

bool isAnagram(const string& s, const string& t) {
    if (s.size() != t.size()) return false;
    int count[256] = {0};
    for (unsigned char c : s) count[c]++;
    for (unsigned char c : t) {
        if (--count[c] < 0) return false;
    }
    return true;
}
```

<!-- @annotations -->
- 9: Decrement first, then test. A count that was already zero goes to -1, which means this character occurs more often in `t` than in `s` — enough to answer, with no need to finish.
- 11: No final sweep of the table is needed. Equal lengths plus no negative entry means no positive entry can survive either.

<!-- @code java -->
```java
static boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] count = new int[256];
    for (int i = 0; i < s.length(); i++) count[s.charAt(i)]++;
    for (int i = 0; i < t.length(); i++) {
        if (--count[t.charAt(i)] < 0) return false;
    }
    return true;
}
```

<!-- @annotations -->
- 6: `--count[...]` evaluates the index once and decrements in place, so there is no double indexing to get wrong.

<!-- @code python -->
```python
def is_anagram(s, t):
    if len(s) != len(t):
        return False
    count = {}
    for c in s:
        count[c] = count.get(c, 0) + 1
    for c in t:
        n = count.get(c, 0)
        if n == 0:
            return False
        count[c] = n - 1
    return True


# 2x slower than Counter on true anagrams (4,468.89us against 2,291.16
# at n = 50,000) and the fastest thing here when it can exit early, at
# 1,926.33 -- the same trade as C++, with a far larger constant.
```

<!-- @annotations -->
- 8: `count.get(c, 0)` treats an absent character as zero, so a character in `t` that never appears in `s` rejects immediately rather than raising.
- 3: In Python this loop is only worth writing when early exits are common. Otherwise `Counter` does the same work in C.

<!-- @approach -->
### Hash Map Counts - When the Alphabet Is Not Yours

<!-- @idea -->
Replace the fixed table with a map, so the alphabet can be anything without sizing a table for it.

<!-- @steps -->
1. Return false if the lengths differ.
2. Create an empty map from character to count.
3. Walk the first string, incrementing each character's count.
4. Walk the second string, decrementing each character's count.
5. Return false if a character is missing from the map or its count would go below zero.
6. Return true if the second walk completes.

<!-- @complexity -->
- time: O(n) expected, with a hashing constant on every character
- space: O(k) in the number of distinct characters actually present
- note: The version to reach for when the input is Unicode text, or any alphabet you do not control the size of. It costs about 4x against a fixed table — measured 215.63 microseconds at n = 50,000 against 49.77 — which is the price of not having to know the alphabet in advance. For genuine Unicode correctness the units must be code points, not bytes and not UTF-16 units, or a single character split across two units will be counted as two.

<!-- @code cpp -->
```cpp
#include <string>
#include <unordered_map>
using namespace std;

bool isAnagram(const string& s, const string& t) {
    if (s.size() != t.size()) return false;
    unordered_map<char, int> count;
    for (char c : s) count[c]++;
    for (char c : t) {
        auto it = count.find(c);
        if (it == count.end() || --it->second < 0) return false;
    }
    return true;
}
```

<!-- @annotations -->
- 10: `find` then decrement through the iterator, rather than `count[c]--`. Using `operator[]` would insert a zero entry for a character that is not there, turning a rejection into a silent -1.

<!-- @code java -->
```java
static boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    Map<Character, Integer> count = new HashMap<>();
    for (int i = 0; i < s.length(); i++)
        count.merge(s.charAt(i), 1, Integer::sum);
    for (int i = 0; i < t.length(); i++) {
        Integer n = count.get(t.charAt(i));
        if (n == null || n == 0) return false;
        count.put(t.charAt(i), n - 1);
    }
    return true;
}
```

<!-- @annotations -->
- 8: `n == 0` on an `Integer` unboxes here because the other operand is an `int` literal, so this is a value comparison. Comparing two `Integer` objects with `==` would not be.

<!-- @code python -->
```python
from collections import Counter


def is_anagram(s, t):
    return len(s) == len(t) and Counter(s) == Counter(t)


# Python's dict is already the hash map, so this is both the general
# version and the idiomatic one. Counter iterates in C, which is why
# it beats the hand-written loop 2x on inputs with no early exit.
```

<!-- @annotations -->
- 5: Python strings iterate by code point, so this is Unicode-correct without extra work — the one place where the high-level version is more correct than the C++ one rather than just shorter.

<!-- @example -->

<!-- @input -->
s = "anagram", t = "nagaram"

<!-- @output -->
true

<!-- @why -->
The standard case, and enough to show the count vector doing the work that ordering does not.

<!-- @walkthrough -->
1. Both strings have length 7, so the guard passes.
2. Counting `s`: a appears 3 times, n once, g once, r once, m once.
3. Counting `t` gives exactly the same five counts.
4. The count vectors are equal, so the strings are anagrams.
5. With one table, the pass over `s` leaves a:3, n:1, g:1, r:1, m:1 and the pass over `t` returns every entry to zero.
6. No decrement ever goes negative, so the early exit never fires and the full 14 characters are read.
7. Sorting both gives `"aaagmnr"` from each, which is the same fact reached in O(n log n).

<!-- @example -->

<!-- @input -->
s = "aac", t = "abb" — and s = "aaa", t = "abb"

<!-- @output -->
false for both, but the character sum accepts the first and XOR accepts the second

<!-- @why -->
The smallest counterexamples to the two most popular shortcuts, which is what turns "use the counts" from advice into a requirement.

<!-- @walkthrough -->
1. For `"aac"` and `"abb"`: the sums are 97 + 97 + 99 and 97 + 98 + 98, both 293.
2. They are equal because `a + c == b + b` — any pair of characters equidistant from a third collides.
3. The count vectors differ, a:2 c:1 against a:1 b:2, so they are not anagrams.
4. For `"aaa"` and `"abb"`: XOR gives `a ^ a ^ a` which is `a`, and `a ^ b ^ b` which is also `a`.
5. Any repeated pair cancels under XOR, so a doubled character is invisible to it.
6. Exhaustively at length 5 over a five-letter alphabet, the sum is wrong on 7.47% of the 9,765,625 pairs and XOR on 11.27%.
7. The reason is countable: there are 126 anagram classes, the sum takes only 21 distinct values and XOR only 8.

<!-- @example -->

<!-- @input -->
A 50,000-character string against another of 50,001 characters, in Python

<!-- @output -->
False in 0.10us with a length guard, and 2,290.12us without one

<!-- @why -->
A performance argument for a guard, rather than the correctness argument the previous two containers made for theirs.

<!-- @walkthrough -->
1. `Counter(s) == Counter(t)` is already correct here — different lengths cannot produce equal counters.
2. But `Counter(s)` walks all 50,000 characters building a table, and `Counter(t)` walks all 50,001.
3. Only then are the two tables compared and found unequal.
4. That measured 2,290.12 microseconds.
5. Prefixing `len(s) == len(t)` short-circuits before either counter is built.
6. That measured 0.10 microseconds — about 22,900x faster.
7. The same guard in front of the hand-written dict loop measured 0.18 against 4,468.89.
8. Nothing about the answer changed; only the amount of work done to reach it.

<!-- @example -->

<!-- @input -->
s = "Listen", t = "Silent" with a 26-entry table indexed by `c - 'a'`

<!-- @output -->
Undefined behaviour — `'L' - 'a'` is -21 and `'S' - 'a'` is -14

<!-- @why -->
The most common real-world failure of the standard solution, triggered by ordinary text rather than by an adversarial input.

<!-- @walkthrough -->
1. The classic anagram examples are usually written capitalised, which is enough to break the standard table.
2. `'L'` is 76 and `'a'` is 97, so `c - 'a'` is -21.
3. `count[-21]` reads and writes 84 bytes before the start of the array.
4. Nothing crashes; the program corrupts whatever is next to it on the stack and returns an answer.
5. A single space would do the same, at -65, and so would any digit.
6. Indexing a 256-entry table by the raw byte instead measured 50.46 microseconds against 49.77 — no measurable cost.
7. That version answers correctly for any byte sequence, though "Listen" and "Silent" are then not anagrams unless the caller case-folds first.

<!-- @visualization custom -->

<!-- @description -->
Put the two strings on facing tracks and drop each character into a bin below it, so the pair of histograms builds up character by character as the scan advances — the picture should make it obvious that the bins stop growing in number while the strings keep streaming, because the fingerprint is fixed-size and the input is not. Then merge the two histograms into one signed table: the first string pushes bars up, the second pulls them down, and the answer is whether every bar returns to the line. Let one bar cross below the line and freeze there, labelled this character occurs more often on the right — that is the early exit, and mark how much of the second string was never read. Beside it keep an honest meter showing that the first pass was unconditional, so the best possible saving is half. The centre of the figure is the lossy-compression argument, and it should be built as a funnel. Start with 126 distinct count vectors drawn as 126 separate cells; funnel them into the character-sum fingerprint and watch them collapse into 21 buckets with several cells landing in each; funnel them again into XOR and watch 126 collapse into 8. Draw the collisions explicitly — `aac` and `abb` falling into the same sum bucket, `aaa` and `abb` into the same XOR bucket — and put the measured error rates beneath, 7.47% and 11.27%. The funnel is the whole point: information destroyed at a fork cannot be recovered downstream. Follow with the prime product as a fourth funnel that does not collapse at all, then overlay a 64-bit ceiling that it punches through after nine characters of `z`, with the 50,000-character constraint drawn far off the right edge of the frame. Close on the two free wins: a 26-cell table beside a 256-cell table with their timings, 49.77 and 50.46, effectively identical, and above them a row of characters — `A`, `Z`, `0`, space — each with an arrow pointing to a negative index off the left end of the 26-cell table.

<!-- @sampleInput -->
```json
{"primary":{"s":"anagram","t":"nagaram","answer":true,"counts":{"a":3,"n":1,"g":1,"r":1,"m":1},"sorted":"aaagmnr"},"smallCases":[{"s":"anagram","t":"nagaram","answer":true},{"s":"rat","t":"car","answer":false},{"s":"aacc","t":"ccac","answer":false,"reason":"three c's against two"},{"s":"ab","t":"ab","answer":true},{"s":"","t":"","answer":true},{"s":"a","t":"ab","answer":false,"reason":"unequal length"}],"coreFact":{"claim":"two strings are anagrams exactly when their character-count vectors are equal","fingerprintIsFixedSize":"one entry per alphabet symbol, regardless of input length","sortingIsTheSameFact":"the sorted string is a canonical form for the multiset; O(n log n) to learn what counting learns in O(n)"},"lossyShortcuts":{"space":"all strings of length 5 over {a,b,c,d,e}","orderedPairs":9765625,"trueAnagramClasses":126,"fingerprints":[{"name":"count vector","distinctValues":126,"classesSeparated":126,"wrongPairs":0},{"name":"character sum","distinctValues":21,"classesSeparated":21,"wrongPairs":729040,"wrongRate":"7.47%"},{"name":"XOR of characters","distinctValues":8,"classesSeparated":8,"wrongPairs":1100180,"wrongRate":"11.27%"}],"byLength":[{"length":3,"pairs":15625,"classes":35,"sumWrong":1206,"sumRate":"7.72%","xorWrong":1500,"xorRate":"9.60%","distinctSums":13,"distinctXors":8},{"length":4,"pairs":390625,"classes":70,"sumWrong":30280,"sumRate":"7.75%","xorWrong":41764,"xorRate":"10.69%","distinctSums":17,"distinctXors":8},{"length":5,"pairs":9765625,"classes":126,"sumWrong":729040,"sumRate":"7.47%","xorWrong":1100180,"xorRate":"11.27%","distinctSums":21,"distinctXors":8}],"counterexamples":{"sum":{"s":"aac","t":"abb","why":"a + c == b + b, both total 293"},"xor":{"s":"aaa","t":"abb","why":"a repeated pair cancels under XOR"}},"xorDoesNotImprove":"stays at 8 distinct values at every length, because the reachable values form a small closed set","sortedAndProductAreExact":"0 mismatches at every length tested"},"primeProduct":{"correct":true,"why":"fundamental theorem of arithmetic — equal products iff equal multisets","overflowSigned64":[{"input":"all 'a' (prime 2)","characters":62},{"input":"all 'm' (prime 41)","characters":11},{"input":"all 'z' (prime 101)","characters":9},{"input":"random lowercase text","characters":"as few as 10"}],"statedConstraint":50000,"verdict":"a correct algorithm for strings of about ten letters, which is not this problem; bignums fix the overflow and are slower than sorting"},"alphabetAssumption":{"standardSolution":"int count[26] indexed by c - 'a'","correctOnlyFor":"lowercase ASCII","indices":[{"char":"a","index":0},{"char":"z","index":25},{"char":"A","index":-32},{"char":"Z","index":-7},{"char":"0","index":-49},{"char":"space","index":-65},{"char":"é (first UTF-8 byte)","index":136}],"consequence":"negative subscripts and reads past the end, silently, with no crash","fix":"index a 256-entry table by the raw byte","costOfFix":{"table26":49.77,"table256":50.46,"verdict":"within noise — use 256"},"unicode":"count code points in a hash map, about 4x: 215.63 against 49.77"},"benchCpp":{"unit":"microseconds per run, Apple M2, clang -O2; medians of three runs on an idle machine","atN50000":[{"shape":"true anagram","sort":580.19,"twoTables":49.77,"oneTable":49.08,"oneTableEarly":55.88,"table256Early":50.46,"hashMap":215.63},{"shape":"differs at the last character","sort":587.66,"twoTables":49.46,"oneTable":46.07,"oneTableEarly":55.51,"table256Early":50.18,"hashMap":214.64},{"shape":"first character of t absent from s","sort":574.57,"twoTables":49.57,"oneTable":48.82,"oneTableEarly":24.63,"table256Early":19.15,"hashMap":137.91}],"atN1000":[{"shape":"true anagram","sort":10.23,"twoTables":1.06,"oneTable":1.05,"oneTableEarly":1.20,"table256Early":1.10,"hashMap":5.40},{"shape":"first character absent","sort":10.54,"twoTables":1.01,"oneTable":1.02,"oneTableEarly":0.50,"table256Early":0.44,"hashMap":3.75}],"atN100":[{"shape":"true anagram","sort":0.93,"twoTables":0.11,"oneTable":0.09,"oneTableEarly":0.12,"table256Early":0.11,"hashMap":1.42},{"shape":"first character absent","sort":1.01,"twoTables":0.10,"oneTable":0.10,"oneTableEarly":0.05,"table256Early":0.07,"hashMap":1.24}],"sortVsCount":[{"n":10,"sort":0.044,"count":0.017,"ratio":"2.6x"},{"n":100,"sort":0.912,"count":0.120,"ratio":"7.6x"},{"n":1000,"sort":10.056,"count":1.146,"ratio":"8.8x"},{"n":10000,"sort":92.391,"count":11.697,"ratio":"8.3x"},{"n":50000,"sort":584.231,"count":55.418,"ratio":"10.5x"}],"earlyExitTrade":{"costWhenItNeverFires":"about 14% — 55.88 against 49.08","saveWhenItFiresFirstCharacter":"about 55% — 24.63 against 55.88","ceiling":"even an immediate exit only halves the runtime, because the pass over s is unconditional"}},"benchPython":{"unit":"microseconds per run, CPython 3.13.4","atN50000":[{"shape":"true anagram","sorted":7961.46,"counter":2291.16,"lenPlusCounter":2319.08,"dictLoop":4468.89},{"shape":"differs at the last character","sorted":7958.68,"counter":2243.68,"lenPlusCounter":2241.40,"dictLoop":4433.34},{"shape":"first character of t absent from s","sorted":7934.65,"counter":2312.57,"lenPlusCounter":2287.74,"dictLoop":1926.33},{"shape":"different lengths","sorted":7905.82,"counter":2290.12,"lenPlusCounter":0.10,"dictLoop":0.18}],"atN100":[{"shape":"true anagram","sorted":8.49,"counter":7.71,"lenPlusCounter":7.76,"dictLoop":7.56},{"shape":"different lengths","sorted":8.17,"counter":7.71,"lenPlusCounter":0.06,"dictLoop":0.06}],"lengthGuard":{"worth":"about 22900x on unequal-length input — 0.10us against 2290.12","notACorrectnessFix":"Counter(s) == Counter(t) already returns False for different lengths","why":"Counter builds both tables in full before comparing them"},"sortedVsCounter":{"atN50000":"about 3.5x slower","atN100":"within noise — 8.49 against 7.71"},"dictLoopVsCounter":{"trueAnagram":"2x slower — 4468.89 against 2291.16","earlyExit":"fastest on the page — 1926.33","reading":"the same early-exit trade as C++, with a far larger constant"}},"assertions":["equal lengths, or the answer is false","every character's count in s equals its count in t","the sorted forms are equal","the relation is symmetric and every string is an anagram of itself","the count vector has fixed size regardless of input length"],"recommendation":"length guard first, then one 256-entry table indexed by raw byte, incremented over s and decremented over t, bailing on a negative; in Python, len(s) == len(t) and Counter(s) == Counter(t); a hash map only when the characters are not bytes","lesson":"when you replace a structure with a summary, the question is not whether the summary is fast but whether it is injective — and that question has an answer you can count"}
```

<!-- @highlights -->
- The two strings sit on facing tracks, each character dropping into a bin below as the scan advances.
- The bins stop growing in number while the strings keep streaming, showing the fingerprint is fixed-size and the input is not.
- The two histograms merge into one signed table: the first string pushes bars up, the second pulls them down.
- The answer is whether every bar returns to the line.
- One bar crosses below the line and freezes, labelled this character occurs more often on the right — the early exit.
- How much of the second string was never read is marked, beside a meter showing the first pass was unconditional, so the best saving is half.
- The centre is a funnel: 126 distinct count vectors drawn as 126 separate cells.
- They funnel into the character-sum fingerprint and collapse into 21 buckets, several cells landing in each.
- They funnel again into XOR and collapse from 126 into 8.
- Collisions are drawn explicitly — `aac` and `abb` in one sum bucket, `aaa` and `abb` in one XOR bucket.
- The measured error rates sit beneath them, 7.47% and 11.27%.
- The funnel makes the point that information destroyed at a fork cannot be recovered downstream.
- A fourth funnel, the prime product, does not collapse at all — but a 64-bit ceiling overlays it, punched through after nine characters of `z`.
- The 50,000-character constraint is drawn far off the right edge of the frame.
- The close is the two free wins: a 26-cell table beside a 256-cell table, timed at 49.77 and 50.46.
- Above them a row of characters — `A`, `Z`, `0`, space — each arrows to a negative index off the left end of the 26-cell table.

<!-- @edgeCases -->
- Both strings empty — anagrams; every table stays zero and the loops never run.
- Unequal lengths — always false, and the guard that is worth 22,900x in Python even though it changes no answer.
- Single characters — `"a"` and `"a"` is true, `"a"` and `"b"` is false; the smallest pair that exercises a count at all.
- Identical strings — always anagrams, since zero rearrangement counts.
- Same characters, different multiplicities, like `"aacc"` and `"ccac"` — false, and exactly what a set-based check would miss.
- A character in `t` that never appears in `s` — false, and the only shape where the early exit fires on the first character.
- Uppercase input like `"Listen"` and `"Silent"` — undefined behaviour with a 26-entry table; `'L' - 'a'` is -21.
- Spaces or punctuation, as in phrase anagrams — same failure, at -65 for a space.
- Multi-byte UTF-8 — a 256-entry byte table counts bytes rather than characters, which is correct for equality but wrong if you meant code points.
- Strings at the 50,000-character limit — where the prime-product approach has been overflowing for 49,990 characters.
- Case- or space-insensitive anagrams — a different problem; normalise before calling, since none of these approaches fold case.

<!-- @pitfalls -->
- Summing the character codes. Exhaustively wrong on 7.47% of length-5 pairs, because the sum takes only 21 distinct values where there are 126 anagram classes — `"aac"` and `"abb"` both total 293.
- XORing the characters. Worse still at 11.27%, and it does not improve with length: XOR reaches only 8 distinct values at any size, and `"aaa"` and `"abb"` collide.
- Multiplying primes. Mathematically exact and overflows a signed 64-bit integer after 9 characters of `z`, or as few as 10 in random text, against a 50,000-character limit.
- Indexing `count[26]` with `c - 'a'`. Correct only for lowercase ASCII; `'A'` gives -32, a space gives -65, and neither crashes.
- Sizing the table to 26 to save memory. A 256-entry table measured 50.46 microseconds against 49.77 — the saving is 920 bytes and the cost is an undocumented precondition.
- Using `operator[]` on a C++ map to decrement. It inserts a zero for a missing character, turning a rejection into a silent -1.
- Comparing arrays with `==` in Java. That is a reference comparison; it must be `Arrays.equals`.
- Omitting the length guard in Python. `Counter(s) == Counter(t)` is still correct but does 100,000 characters of work to learn what `len` knew — 2,290.12 microseconds against 0.10.
- Expecting the early exit to make this fast. It halves the runtime at best, because the pass over the first string always runs to completion.
- Writing the dict loop in Python by default. It is 2x slower than `Counter` unless early exits are common, because `Counter` counts in C.
- Counting UTF-8 bytes and calling it Unicode-correct. It answers the equality question correctly but counts bytes, not characters, so any per-character reasoning built on it is wrong.

<!-- @doubt -->
### Why is summing or XORing the characters wrong? It feels like it should work.

<!-- @answer -->
Because a single number cannot carry as much information as a vector of counts, and the shortfall is countable. Over all strings of length 5 on a five-letter alphabet there are exactly **126** distinct anagram classes. The count vector takes 126 distinct values, so it separates all of them. The character sum takes only **21** distinct values and XOR only **8** — so by the pigeonhole principle they must merge classes, and they do: the sum is wrong on 7.47% of the 9,765,625 ordered pairs and XOR on 11.27%. The counterexamples are two and three characters long. `"aac"` and `"abb"` have the same sum because `a + c == b + b`. `"aaa"` and `"abb"` have the same XOR because a repeated pair cancels. XOR is the worse of the two and does not improve with length — it is still only 8 values at length 5.

<!-- @doubt -->
### What about multiplying primes? That one is provably correct.

<!-- @answer -->
It is provably correct and practically unusable, which is a distinction worth holding onto. Assign each letter a prime and multiply; by unique factorisation two products are equal exactly when the multisets are, and it produced zero mismatches on every pair tested. Then count digits: 101 is the prime for `z`, and `101^9` already exceeds a signed 64-bit integer, so nine characters of `z` overflow. Random lowercase text overflowed after as few as 10 characters. The stated constraint is 50,000. You can switch to arbitrary-precision integers, at which point you are doing 50,000 multiplications into a number thousands of digits long — correct, and slower than just sorting both strings. The count vector is the same fingerprint without the numeric encoding, and it never overflows.

<!-- @doubt -->
### Is `count[26]` fine? The problem says lowercase letters.

<!-- @answer -->
It is fine exactly as long as that stays true, and it fails silently the moment it does not. `c - 'a'` gives -32 for `'A'`, -7 for `'Z'`, -49 for `'0'` and -65 for a space — all negative subscripts, all undefined behaviour, none of which crash. The classic worked examples are usually capitalised, so `"Listen"` and `"Silent"` corrupt memory rather than answering. The fix is to index a 256-entry table by the raw byte, and it is free: measured 50.46 microseconds against 49.77 at n = 50,000, which is noise. You spend 920 extra bytes and delete a precondition. For text that is not one byte per character, count code points in a hash map instead, at about 4x — 215.63 against 49.77.

<!-- @doubt -->
### Should I sort or count?

<!-- @answer -->
Count, unless the alphabet is unknown and you want the shortest correct thing. Both are exactly correct — sorting produces a canonical form for the multiset and matched the definition on all 9,765,625 exhaustive pairs — but counting is O(n) against O(n log n) and the measured gap is about an order of magnitude: 584.231 microseconds against 55.418 at n = 50,000, 8.8x at n = 1,000, and 2.6x at n = 10 where the sort barely runs. The one thing sorting has going for it is that it assumes nothing about the alphabet, so it is a good reference implementation to check a fast version against. In Python at small sizes the choice barely matters: `sorted` and `Counter` measured 8.49 and 7.71 microseconds at n = 100.

<!-- @doubt -->
### How much does the early exit actually buy?

<!-- @answer -->
Half, at the very best, and it costs about 14% when it does not fire. With one table you can return as soon as a decrement goes negative. Measured at n = 50,000: on input where the first character of `t` does not occur in `s` at all, the early-exit version took 24.63 microseconds against 55.88 for the same code without the check — a 55% saving. On a true anagram, where the exit never fires, it took 55.88 against 49.08, so the extra branch costs about 14%. The ceiling is structural: the pass over `s` that builds the table is unconditional, so even an exit on the very first character of `t` leaves you having read half the input. There is no constant-time version of this.

<!-- @doubt -->
### Why does adding `len(s) == len(t)` speed up Python so much when the answer is already right?

<!-- @answer -->
Because `Counter` does not know the answer is already available. `Counter(s) == Counter(t)` builds a complete table for each string and only then compares them, so on strings of different lengths it walks 100,000 characters to discover something `len` could have said immediately. Measured at n = 50,000 with a one-character difference in length: 2,290.12 microseconds without the guard, **0.10 with it** — about 22,900x. It is worth being clear that this is not a correctness fix, unlike the guards in Isomorphic String and Rotate String: the unguarded version returns the right answer. It just pays for it. The same guard in front of the hand-written dict loop measured 0.18 against 4,468.89.

<!-- @doubt -->
### Which Python version should I write?

<!-- @answer -->
`len(s) == len(t) and Counter(s) == Counter(t)`, unless you expect most answers to be `False` for a reason that shows up early. `Counter` counts in C, so it beats the hand-written dict loop 2x on true anagrams — 2,291.16 microseconds against 4,468.89 at n = 50,000. But the dict loop can stop the moment a character in `t` is missing from `s`, and on that input it was the fastest thing measured, at 1,926.33. That is the same trade C++ makes with its early exit, with a much larger constant on both sides. `sorted(s) == sorted(t)` is the shortest correct answer and about 3.5x slower than `Counter` at this size, though at n = 100 the three are within a couple of microseconds of each other.

<!-- @doubt -->
### Is this the same idea as the canonical forms in the last two problems?

<!-- @answer -->
Yes, and the comparison is worth making explicit. Sorting a string is a canonical form for its multiset, exactly as the first-occurrence encoding is a canonical form for isomorphism and Booth's least rotation is one for rotation — in each case a representative that is equal for precisely the members of one equivalence class, which makes it a hash key and turns grouping from quadratic into one pass. That is what Group Anagrams is built on. What is different here is that the count vector gives you the same power **without** a canonical form: it is a fixed-size fingerprint you can compare directly in O(1) once built, and it is injective, which the character sum and XOR are not. The general question this problem answers precisely is the one to carry forward — when you replace a structure with a summary, ask not whether the summary is fast but whether it is injective, and count the collisions.
