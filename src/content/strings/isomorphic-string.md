---
id: isomorphic-string
topic: Strings
title: Isomorphic String
difficulty: Easy
status: ready
prerequisites:
  - for-loop
  - if-else-statements
  - data-types
  - largest-odd-number-in-a-string
  - longest-common-prefix
  - time-and-space-complexity-basics
relatedIds:
  - rotate-string
  - check-if-two-strings-are-anagram-of-each-other
  - sort-characters-by-frequency
  - longest-common-prefix
  - two-sum
---

<!-- @summary -->
Decide whether one string can be turned into another by renaming characters — where the requirement is a **bijection**, so the one-way check almost everyone writes first is wrong on **67.8% of the pairs it accepts**, measured exhaustively; where the famous Python one-liner is wrong on 10,476 exhaustive counterexamples because `zip` truncates; and where the canonical form that looks like the clever answer has no early exit, making it 3,500x slower than the direct check on a pair that differs at the first character.

<!-- @theory -->
## The problem

Two strings `s` and `t` are **isomorphic** if you can replace the characters of
`s` to get `t`, preserving order. A character may map to itself, but **no two
characters may map to the same character**.

```
"egg"   "add"    ->  true    e->a, g->d
"foo"   "bar"    ->  false   o would have to be both a and r
"paper" "title"  ->  true    p->t, a->i, e->l, r->e
"badc"  "baba"   ->  false   d and b both map to b
```

Both strings have the same length in every true case, and the standard
constraint puts the length at up to 50,000.

## The requirement is a bijection, and that is the whole problem

Read the last clause of the definition again: *no two characters may map to the
same character*. That is not a footnote. It makes the mapping a **bijection**
between the character set of `s` and the character set of `t`, which means it has
to be checked in **both directions**.

Almost everyone writes the one-way version first:

```
for each position i:
    if s[i] is already mapped and maps to something other than t[i]: false
    record s[i] -> t[i]
```

It accepts `"ab"` and `"aa"`. Both `a` and `b` map to `a`, so `"aa"` cannot be
turned back into `"ab"` — the renaming is not reversible, and the strings are not
isomorphic.

## How wrong is the one-way check

Wrong far more often than "edge case" suggests. Over every ordered pair of equal
length strings up to length 5 on a three-letter alphabet — 66,430 pairs:

| | Pairs |
|---|---|
| The one-way check accepts | 6,634 |
| **Of those, genuinely isomorphic** | **2,134** |
| **Of those, not isomorphic — wrong** | **4,500 (67.8%)** |

**Two out of every three "yes" answers from the one-way check are wrong.** The
smallest counterexample is two characters long: `s = "ab"`, `t = "aa"`.

That figure is worth sitting with. A bug that fires on a third of inputs is a bug
you find. A bug that fires on 67.8% of the *positive* answers is one that passes
whatever handful of examples you tried, because the examples people try are
mostly genuine isomorphisms.

The fix is one extra line — check the reverse map too:

```
if t[i] is already mapped and maps to something other than s[i]: false
record t[i] -> s[i]
```

Measured, the one-way version is about 20% faster than the correct one (32.42
microseconds against 39.22 at n = 50,000). That is what the wrongness buys.

## Three correct formulations, and they are the same idea

**Two maps.** Keep `s -> t` and `t -> s`. Reject on any disagreement in either.
The direct transcription of the definition.

**Two arrays.** The maps are keyed by a character, so an array of 256 entries is
a map — no hashing, no allocation, and the whole table fits in a cache line or
four. Same algorithm, different container.

**Last-seen index.** Keep, for each character, the position where it last
appeared. At every position, `s[i]` and `t[i]` must have last appeared at the
*same* place. This is the neatest of the three: it collapses both directions into
a single equality test, because "these two characters have always co-occurred" is
exactly what the bijection requires.

All three were verified against the definition over 66,430 exhaustive pairs and
20,000 random ones, with zero mismatches.

## The canonical form, and what it is actually for

Replace each character with **the index of its first occurrence**:

```
"egg"    ->  [0, 1, 1]
"add"    ->  [0, 1, 1]     equal, so isomorphic
"foo"    ->  [0, 1, 1]
"bar"    ->  [0, 1, 2]     unequal, so not
```

Two strings are isomorphic **exactly when their encodings are equal** — zero
mismatches over the same 66,430 pairs. This is a genuinely different kind of
answer: it is a *canonical form*, so it turns a pairwise predicate into a
**hashable key**. Grouping 10,000 strings into isomorphism classes with the
pairwise test is 50 million comparisons; with the key it is one pass and a hash
map.

For deciding a single pair, though, it is the wrong tool, and the reason is one
this topic keeps returning to — **it has no early exit.** It must build both
encodings in full before comparing anything. Measured at n = 50,000:

| Input | Direct check | Canonical form |
|---|---|---|
| Isomorphic | 51.08us | **38.83us** |
| Differs at the last character | 49.99us | 38.50us |
| **Differs at the first character** | **0.01us** | **35.14us** |

On a pair that disagrees immediately the canonical form is **3,500x slower**,
because the direct check reads two characters and the encoding reads 100,000.
Note the first row too: on genuinely isomorphic input the canonical form is
*faster* than the direct check, at 38.83 against 51.08, because building two
arrays and comparing them vectorises where the branchy two-table check does not.

Same shape as **Longest Common Prefix**: the method that wins is decided by
whether the answer arrives early, not by the size of the input.

## Arrays beat hash maps, and by more than you would guess

Same algorithm, `unordered_map<char,char>` against `unsigned char[256]`:

| n | Two hash maps | Two arrays | Ratio |
|---|---|---|---|
| 100 | 2.973us | 0.099us | **30.1x** |
| 1,000 | 10.920us | 1.016us | 10.7x |
| 10,000 | 88.437us | 10.031us | 8.8x |
| 50,000 | 439.156us | 51.024us | **8.6x** |

Roughly an order of magnitude at every size, and 30x at small ones where the
map's construction cost has nothing to amortise against. The key is a `char`.
A `char` is already an array index. Hashing it, storing it in buckets and chasing
pointers is work done to reach a location that arithmetic reaches for free.

## The Python one-liner is wrong, and here is exactly how

This is widely posted as the elegant answer:

```python
len(set(s)) == len(set(t)) == len(set(zip(s, t)))
```

The idea is sound — count distinct characters on each side and distinct *pairs*,
and if all three agree the pairing is a bijection. On equal-length inputs it is
exactly correct: zero mismatches over all 66,430 equal-length pairs.

**But `zip` stops at the shorter string.** So `s = "a"`, `t = "aa"` gives
`set(s)` of size 1, `set(t)` of size 1, and `set(zip(s, t))` of size 1 — all
equal, so it returns `True` for two strings of different lengths.

Exhaustively, over all 132,496 ordered pairs of strings up to length 5:

| | Pairs |
|---|---|
| Unequal length | 66,066 |
| **Wrongly accepted by the unguarded one-liner** | **10,476 (15.86%)** |
| Wrong on any equal-length pair | **0** |
| Wrong once `len(s) == len(t)` is added | **0** |

Every single failure is an unequal-length pair. The one-liner is not broken — it
is missing a guard, and the guard is the first thing the two-map version does
anyway.

## The other Python one-liner is quadratic, but only sometimes

Also widely posted:

```python
[s.index(c) for c in s] == [t.index(c) for c in t]
```

It computes the canonical form, correctly. But `str.index` **scans** from the
start, so each lookup costs as much as the distance to that character's first
occurrence.

On a 26-letter alphabet every first occurrence is near the front, so it behaves
linearly and looks fine — 205.68us at n = 4,000. Feed it strings whose characters
are mostly distinct and the same code degrades:

| n | Time on all-distinct input | Growth per doubling |
|---|---|---|
| 500 | 61.3us | |
| 1,000 | 177.7us | **x2.90** |
| 2,000 | 489.6us | x2.76 |
| 4,000 | 1,586.2us | x3.24 |
| 8,000 | 5,287.4us | **x3.33** |

A linear method doubles. This is heading for 4x, held below it only by how fast
`str.index` is per byte. At n = 4,000 it measured 1,550.77us against 619.54 for
the dictionary-built encoding — and the gap widens with every size.

So the alphabet decides whether this one-liner is fine or a time limit. That is a
dependence on the *input's* character distribution that nothing in the code hints
at.

## Where Python inverts

Measured at n = 5,000, microseconds:

| Shape | Two dicts | Guarded set one-liner | `str.translate` | Canonical form |
|---|---|---|---|---|
| Isomorphic | 263.42 | 185.94 | **149.50** | 383.84 |
| Differs at the last character | 268.69 | 187.66 | **150.37** | 388.70 |
| **Differs at the first character** | **0.32** | 183.19 | 142.67 | 387.76 |

The dict loop is the *slowest* correct method on isomorphic input and **570x
faster** than the set one-liner when the answer is `False` at position 0 — because
it is the only one that stops. Every C-level method here reads both strings in
full, whatever the answer.

Which gives the Python rule for this problem: if you expect mostly `False`
answers that fail early, write the loop; if you expect mostly `True`, push the
work into C. `str.translate` with a table built from `zip` is the fastest correct
option at 149.50us, and it needs the same distinct-count guard the set version
does, or it accepts a many-to-one renaming.

<!-- @intuition -->
The definition hides its hardest clause at the end. "Replace the characters of s to get t" sounds like a one-directional rewrite, and that reading produces code that is wrong two times out of three on the inputs it approves — not because the reasoning is subtle, but because the examples anyone tries by hand are mostly genuine isomorphisms, so the bug has nothing to fail on. What makes it click is naming what the mapping must be: not a lookup table but a bijection, a renaming you could undo. Once it is a bijection, checking it in both directions stops feeling like belt-and-braces and starts feeling like the definition. The second idea is that this predicate has a canonical form. Rewriting each character as the position where it first appeared strips away which letters were used and keeps only the pattern of repetition, which is the only thing isomorphism cares about. That converts "are these two the same" into "do these two have the same key", and a key can go in a hash map — which matters enormously if you are grouping ten thousand strings, and not at all if you are comparing two. The cost of that elegance is the thing worth carrying away: a canonical form must read all of its input before it can say anything, so it cannot take the shortcut that a direct comparison gets for free.

<!-- @approach -->
### Two Hash Maps - The Definition, Transcribed

<!-- @idea -->
Keep both directions of the mapping and reject the moment either disagrees.

<!-- @steps -->
1. Return false immediately if the lengths differ.
2. Create one map from characters of the first string to the second, and one the other way.
3. Walk both strings together, one position at a time.
4. Reject if the first string's character is already mapped to something other than the current character of the second.
5. Reject if the second string's character is already mapped to something other than the current character of the first.
6. Record both directions and continue.
7. Return true if the walk completes.

<!-- @complexity -->
- time: O(n) — one pass, constant expected work per position
- space: O(k) where k is the alphabet size, bounded by 256 for bytes
- note: The version to write first because it says what the definition says, and the version to replace once it works. Measured 447.23 microseconds at n = 50,000 against 51.08 for the identical algorithm on plain arrays — 8.6x, rising to 30.1x at n = 100 where the maps have no work to amortise their construction against. The key is a character, and a character is already an index.

<!-- @code cpp -->
```cpp
#include <string>
#include <unordered_map>
using namespace std;

bool isIsomorphic(const string& s, const string& t) {
    if (s.size() != t.size()) return false;
    unordered_map<char, char> forward, backward;
    for (size_t i = 0; i < s.size(); i++) {
        auto f = forward.find(s[i]);
        if (f != forward.end() && f->second != t[i]) return false;
        auto b = backward.find(t[i]);
        if (b != backward.end() && b->second != s[i]) return false;
        forward[s[i]] = t[i];
        backward[t[i]] = s[i];
    }
    return true;
}
```

<!-- @annotations -->
- 12: The line almost everyone omits. Without it `"ab"` and `"aa"` are accepted, and 67.8% of this function's true answers become wrong.
- 6: The length guard. It is also the guard the famous Python one-liner is missing.

<!-- @code java -->
```java
static boolean isIsomorphic(String s, String t) {
    if (s.length() != t.length()) return false;
    Map<Character, Character> forward = new HashMap<>(), backward = new HashMap<>();
    for (int i = 0; i < s.length(); i++) {
        char a = s.charAt(i), b = t.charAt(i);
        if (forward.containsKey(a) && forward.get(a) != b) return false;
        if (backward.containsKey(b) && backward.get(b) != a) return false;
        forward.put(a, b);
        backward.put(b, a);
    }
    return true;
}
```

<!-- @annotations -->
- 6: `forward.get(a) != b` compares an unboxed `char` against a `Character`, so it unboxes rather than comparing references. Assigning to a `char` first makes that explicit and avoids the `Integer`-cache class of bug entirely.

<!-- @code python -->
```python
def is_isomorphic(s, t):
    if len(s) != len(t):
        return False
    forward, backward = {}, {}
    for a, b in zip(s, t):
        if forward.setdefault(a, b) != b or backward.setdefault(b, a) != a:
            return False
    return True


# The slowest correct method here on isomorphic input (263.42us at
# n = 5,000) and 570x the fastest when the answer is False at position
# 0 (0.32us against 183.19) -- it is the only one that stops early.
```

<!-- @annotations -->
- 6: `setdefault` inserts and returns in one call: if the key is new it stores the value and returns it, so the comparison passes; if it exists it returns the old value, and a mismatch is a rejection.
- 2: The explicit length check is required. `zip` stops at the shorter string, so without this line the loop silently compares a prefix.

<!-- @approach -->
### Two Arrays - The Same Algorithm Without the Hashing

<!-- @idea -->
The keys are characters, so index a 256-entry array directly instead of hashing.

<!-- @steps -->
1. Return false immediately if the lengths differ.
2. Create two arrays of 256 entries, zeroed, meaning "not yet mapped".
3. Walk both strings together.
4. Reject if the forward entry for this character of the first string is set and does not hold the current character of the second.
5. Reject if the backward entry for this character of the second string is set and does not hold the current character of the first.
6. Store both directions and continue.
7. Return true if the walk completes.

<!-- @complexity -->
- time: O(n) — one pass, genuinely constant work per position rather than expected-constant
- space: O(1) — two fixed 256-byte tables, regardless of input size
- note: The one to write. Measured 51.08 microseconds at n = 50,000 against 447.23 for the hash-map version, and 0.01 microseconds when the pair differs at the first character, because it returns on the second character read. Zero is a safe "unmapped" sentinel only because no valid character maps to the NUL byte; on input that can contain NUL, use a separate presence flag.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

bool isIsomorphic(const string& s, const string& t) {
    if (s.size() != t.size()) return false;
    unsigned char forward[256] = {0}, backward[256] = {0};
    for (size_t i = 0; i < s.size(); i++) {
        unsigned char a = s[i], b = t[i];
        if (forward[a] && forward[a] != b) return false;
        if (backward[b] && backward[b] != a) return false;
        forward[a] = b;
        backward[b] = a;
    }
    return true;
}
```

<!-- @annotations -->
- 8: `unsigned char`, not `char`. Plain `char` is signed on x86 and ARM, so a byte above 127 indexes at a negative offset — out of bounds, and silently so.
- 6: 512 bytes of table for any input size. That is why this stays flat while the hash version grows.
- 9: Zero doubles as "unmapped". Valid only because a real mapping never produces the NUL byte.

<!-- @code java -->
```java
static boolean isIsomorphic(String s, String t) {
    if (s.length() != t.length()) return false;
    char[] forward = new char[256], backward = new char[256];
    for (int i = 0; i < s.length(); i++) {
        char a = s.charAt(i), b = t.charAt(i);
        if (forward[a] != 0 && forward[a] != b) return false;
        if (backward[b] != 0 && backward[b] != a) return false;
        forward[a] = b;
        backward[b] = a;
    }
    return true;
}
```

<!-- @annotations -->
- 3: 256 entries covers Latin-1 only. Java `char` is a UTF-16 code unit, so arbitrary input needs 65,536 entries or a map — and text outside the Basic Multilingual Plane needs code points rather than `char` at all.

<!-- @code python -->
```python
def is_isomorphic(s, t):
    if len(s) != len(t):
        return False
    forward, backward = [0] * 256, [0] * 256
    for a, b in zip(s.encode(), t.encode()):
        if forward[a] and forward[a] != b:
            return False
        if backward[b] and backward[b] != a:
            return False
        forward[a], backward[b] = b, a
    return True


# Faithful, but not the Python answer: list indexing costs the same as
# dict lookup here, and the encode() adds a pass. The dict version reads
# better and measures the same.
```

<!-- @annotations -->
- 5: `.encode()` is needed to get integers to index with, and it copies both strings. In C++ the array version is 8.6x the map version; in Python the two are within noise, so this translation buys nothing.

<!-- @approach -->
### Optimal - Last-Seen Index

<!-- @idea -->
Two characters correspond exactly when they have always appeared at the same positions, so compare where each last appeared.

<!-- @steps -->
1. Return false immediately if the lengths differ.
2. Create two arrays of 256 entries holding zero, meaning "never seen".
3. Walk both strings together, tracking the position.
4. Reject if the last-seen position of this character of the first string differs from that of the second.
5. Store the current position plus one in both entries.
6. Return true if the walk completes.

<!-- @complexity -->
- time: O(n) — one pass, one comparison per position instead of two
- space: O(1) — two fixed 256-entry tables
- note: The neatest correct form, because it collapses both directions of the bijection into a single equality: two characters that have always co-occurred have the same last-seen position, and any violation in either direction breaks that. Measured 39.22 microseconds at n = 50,000 against 51.08 for the two-table version. Positions are stored plus one so that zero can mean "never seen" without a separate flag.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

bool isIsomorphic(const string& s, const string& t) {
    if (s.size() != t.size()) return false;
    int lastS[256] = {0}, lastT[256] = {0};
    for (size_t i = 0; i < s.size(); i++) {
        unsigned char a = s[i], b = t[i];
        if (lastS[a] != lastT[b]) return false;
        lastS[a] = lastT[b] = (int)i + 1;
    }
    return true;
}
```

<!-- @annotations -->
- 9: One comparison covers both directions. If `a` mapped to something else earlier, its last-seen differs from `b`'s; if something else mapped to `b`, the same test fails from the other side.
- 10: `i + 1`, so that 0 means "never seen" and position 0 is distinguishable from absence. Storing `i` directly makes the first character look unseen.

<!-- @code java -->
```java
static boolean isIsomorphic(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] lastS = new int[256], lastT = new int[256];
    for (int i = 0; i < s.length(); i++) {
        char a = s.charAt(i), b = t.charAt(i);
        if (lastS[a] != lastT[b]) return false;
        lastS[a] = lastT[b] = i + 1;
    }
    return true;
}
```

<!-- @annotations -->
- 7: Both tables are written with the same value every time, which is what keeps the two directions in lockstep with a single test.

<!-- @code python -->
```python
def is_isomorphic(s, t):
    if len(s) != len(t):
        return False
    last_s, last_t = {}, {}
    for i, (a, b) in enumerate(zip(s, t), 1):
        if last_s.get(a) != last_t.get(b):
            return False
        last_s[a] = last_t[b] = i
    return True


# enumerate(..., 1) starts at 1, so a missing key returning None is
# never confused with a character last seen at position 0.
```

<!-- @annotations -->
- 6: `.get` returns `None` for an absent key, and `None != None` is false, so two characters both being new is correctly treated as agreement.

<!-- @approach -->
### Canonical Form - For Grouping, Not for Pairs

<!-- @idea -->
Rewrite each string as the sequence of first-occurrence indices; isomorphic strings produce identical sequences.

<!-- @steps -->
1. Walk the string, remembering where each character first appeared.
2. Emit that first-occurrence index for every position.
3. Do the same for the other string.
4. The strings are isomorphic exactly when the two sequences are equal.
5. For a set of strings, use the sequence as a hash key rather than comparing pairs.

<!-- @complexity -->
- time: O(n) to build each encoding, O(n) to compare — but with no early exit at all
- space: O(n) for each encoding, against O(1) for the direct checks
- note: A different kind of answer: a canonical form turns a pairwise predicate into a hashable key, so grouping 10,000 strings costs one pass instead of 50 million comparisons. For a single pair it is the wrong tool — it must read both strings entirely before comparing, so on a pair differing at the first character it measured 35.14 microseconds against 0.01, about **3,500x**. On genuinely isomorphic input it is the faster of the two, at 38.83 against 51.08, because building and comparing two arrays vectorises where the branchy table check does not.

<!-- @code cpp -->
```cpp
#include <cstring>
#include <string>
#include <vector>
using namespace std;

vector<int> canonical(const string& s) {
    int first[256];
    memset(first, -1, sizeof first);
    vector<int> out(s.size());
    for (size_t i = 0; i < s.size(); i++) {
        unsigned char c = s[i];
        if (first[c] < 0) first[c] = (int)i;
        out[i] = first[c];
    }
    return out;
}

bool isIsomorphic(const string& s, const string& t) {
    return s.size() == t.size() && canonical(s) == canonical(t);
}
```

<!-- @annotations -->
- 8: `-1` as the sentinel here, not `0`, because `0` is a legitimate first-occurrence index — the first character of every string has it.
- 19: Both encodings are built in full before the comparison starts. That is the price of a canonical form, and it is why this loses so badly on an early mismatch.

<!-- @code java -->
```java
static int[] canonical(String s) {
    int[] first = new int[256];
    Arrays.fill(first, -1);
    int[] out = new int[s.length()];
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (first[c] < 0) first[c] = i;
        out[i] = first[c];
    }
    return out;
}

static boolean isIsomorphic(String s, String t) {
    return s.length() == t.length() && Arrays.equals(canonical(s), canonical(t));
}
```

<!-- @annotations -->
- 14: `Arrays.equals`, not `==`. Array `==` compares references, so `canonical(s) == canonical(t)` is false for every input including identical strings.

<!-- @code python -->
```python
def canonical(s):
    first = {}
    return [first.setdefault(c, i) for i, c in enumerate(s)]


def is_isomorphic(s, t):
    return len(s) == len(t) and canonical(s) == canonical(t)


# As a key, this is the point: grouping strings by isomorphism class is
#     groups.setdefault(tuple(canonical(w)), []).append(w)
# in one pass, where the pairwise test would be quadratic.
#
# Do NOT write [s.index(c) for c in s]. It computes the same thing, but
# str.index scans to the first occurrence, so on strings with many
# distinct characters it grows x2.90, x2.76, x3.24, x3.33 per doubling.
```

<!-- @annotations -->
- 3: `setdefault` returns the stored index on a repeat and the new one on a first sighting, which is exactly the encoding — one dict operation per character, no scanning.
- 12: The `index` version measured 1,550.77us against 619.54 at n = 4,000 on all-distinct input, and it looks linear on a 26-letter alphabet, which is what makes it dangerous.

<!-- @example -->

<!-- @input -->
s = "egg", t = "add"

<!-- @output -->
true

<!-- @why -->
The smallest genuine isomorphism, and the one where all three formulations visibly agree.

<!-- @walkthrough -->
1. Position 0: `e` and `a` are both unseen, so record `e -> a` and `a -> e`.
2. Position 1: `g` and `d` are both unseen, so record `g -> d` and `d -> g`.
3. Position 2: `g` is already mapped to `d`, which matches, and `d` maps back to `g`, which matches.
4. The walk completes, so the answer is true.
5. By last-seen index: at position 2, `g` last appeared at 2 and `d` last appeared at 2 — equal, so accept.
6. By canonical form: `"egg"` encodes to [0, 1, 1] and `"add"` encodes to [0, 1, 1].
7. The encodings are equal, which is the same answer reached without ever building a map.

<!-- @example -->

<!-- @input -->
s = "ab", t = "aa"

<!-- @output -->
false — but the one-way check says true

<!-- @why -->
The smallest input that separates a bijection from a one-directional map, and the counterexample the whole container turns on.

<!-- @walkthrough -->
1. Position 0: `a` maps to `a`. Nothing objectionable.
2. Position 1: `b` has not been mapped before, so a forward-only check records `b -> a` and accepts.
3. But `a` on the right is now the image of both `a` and `b`.
4. The renaming cannot be undone: from `"aa"` there is no way to know which position was originally `b`.
5. The backward map catches it — `a` on the right is already mapped to `a` on the left, and now claims `b`.
6. By last-seen index: at position 1, `b` was never seen (0) while `a` on the right last appeared at position 1 — unequal, so reject.
7. By canonical form: `"ab"` is [0, 1] and `"aa"` is [0, 0], which differ.

<!-- @example -->

<!-- @input -->
Every ordered pair of equal-length strings up to length 5 over {a, b, c}

<!-- @output -->
The one-way check gives 6,634 "yes" answers, of which 4,500 are wrong

<!-- @why -->
Turns "you must check both directions" from advice into a measured failure rate, on the answers that matter.

<!-- @walkthrough -->
1. There are 66,430 ordered pairs of equal length in this space.
2. The correct answer is computed from the definition — a bijection in both directions.
3. The one-way check disagrees on 4,500 of the 66,430 pairs, which is 6.77% overall.
4. But it only ever errs by saying yes, so the honest denominator is its positive answers.
5. It answers yes 6,634 times, and only 2,134 of those pairs are genuinely isomorphic.
6. So 67.8% of its yes answers are wrong — two out of every three.
7. The smallest failing pair is `("ab", "aa")`, at length 2, which no hand-picked example is likely to include.

<!-- @example -->

<!-- @input -->
s = "a", t = "aa", given to the unguarded Python one-liner

<!-- @output -->
True, which is wrong

<!-- @why -->
Shows that the famous one-liner's defect is a missing guard rather than a wrong idea, and locates it precisely.

<!-- @walkthrough -->
1. The one-liner is `len(set(s)) == len(set(t)) == len(set(zip(s, t)))`.
2. `set("a")` has one element and `set("aa")` has one element, so the first two counts agree.
3. `zip("a", "aa")` stops when the shorter input runs out, yielding a single pair.
4. So `set(zip(s, t))` also has one element, all three counts are 1, and the expression is True.
5. The strings have different lengths, so they cannot be isomorphic under any definition.
6. Exhaustively over all 132,496 ordered pairs up to length 5, this accepts 10,476 pairs it should reject.
7. Every one of those is an unequal-length pair — on the 66,430 equal-length pairs it is exactly correct.
8. Adding `len(s) == len(t)` in front brings the error count to zero.

<!-- @visualization custom -->

<!-- @description -->
Draw the two strings as parallel tracks, character cells aligned by position, with an arrow drawn between each aligned pair as the scan advances. Colour an arrow green when it agrees with what has been recorded and red when it contradicts. The centre of the opening is the bijection: keep two panels beside the tracks, one for the forward map and one for the backward, and populate both as arrows are drawn — then run `"ab"` against `"aa"` and let the forward panel stay entirely green while the backward panel turns red on the second character. Hold that split frame, because it is the bug: everything the one-way check can see is still green. Under it place the measured verdict as a two-part bar — 6,634 accepted, split into 2,134 correct and 4,500 wrong — and label the wrong segment 67.8% of its yes answers. Next, replace the two map panels with a single row of last-seen positions and rerun the same input, showing one equality test per position doing the work both panels were doing, and the same rejection arriving at the same character. Then switch to the canonical form: fade the letters out of both tracks and replace each cell with the index of that character's first occurrence, so that `"egg"` and `"add"` visibly become the identical row [0, 1, 1] while `"foo"` and `"bar"` become [0, 1, 1] and [0, 1, 2]. Make the point that the letters were never the content. Immediately price it: put the early-mismatch case beside it, with the direct check lighting two cells and stopping at 0.01us while the canonical form lights all 100,000 and takes 35.14us, drawn to scale so the 3,500x is a picture and not a number. Close on the `zip` truncation. Show `"a"` above `"aa"`, draw the zip pairing as a bracket that visibly ends after one column with the second column of the lower string left dangling and unpaired, and put all three set-size counters at 1 with a green tick — then drop the length guard in as a gate in front of the whole expression and watch the tick become a cross.

<!-- @sampleInput -->
```json
{"primary":{"s":"egg","t":"add","answer":true,"forward":{"e":"a","g":"d"},"backward":{"a":"e","d":"g"},"canonicalS":[0,1,1],"canonicalT":[0,1,1]},"smallCases":[{"s":"egg","t":"add","answer":true},{"s":"foo","t":"bar","answer":false,"reason":"o would have to map to both a and r"},{"s":"paper","t":"title","answer":true},{"s":"badc","t":"baba","answer":false,"reason":"d and b both map to b"},{"s":"ab","t":"aa","answer":false,"reason":"the smallest bijection counterexample"},{"s":"a","t":"aa","answer":false,"reason":"unequal length; the zip-truncation counterexample"},{"s":"","t":"","answer":true}],"definition":{"statement":"the characters of s can be replaced to get t, preserving order","criticalClause":"no two characters may map to the same character","meaning":"the mapping must be a bijection, so it has to be checked in both directions"},"oneWayBug":{"description":"only the s -> t direction is recorded and checked","smallestCounterexample":{"s":"ab","t":"aa"},"exhaustiveSpace":"all ordered pairs of equal-length strings up to length 5 over {a,b,c}","totalPairs":66430,"accepted":6634,"acceptedAndCorrect":2134,"acceptedAndWrong":4500,"wrongShareOfYesAnswers":"67.8%","wrongShareOfAllPairs":"6.77%","errsOnlyBy":"saying yes","speedBought":"about 20% — 32.42us against 39.22us at n = 50,000","reading":"two out of every three yes answers are wrong, and hand-picked examples are mostly genuine isomorphisms so the bug has nothing to fail on"},"correctFormulations":[{"name":"two maps","idea":"keep s->t and t->s, reject on either disagreement"},{"name":"two arrays","idea":"the same maps keyed by character, so a 256-entry array is the map"},{"name":"last-seen index","idea":"two characters correspond exactly when they last appeared at the same position; one equality test covers both directions"}],"verification":[{"kind":"exhaustive, equal-length pairs up to length 5 over {a,b,c}","pairs":66430,"twoArraysMismatches":0,"lastSeenMismatches":0,"canonicalMismatches":0,"guardedSetOneLinerMismatches":0},{"kind":"random pairs, C++ cross-check","pairs":20000,"mismatches":0},{"kind":"random pairs of mixed length, Python cross-check","pairs":20000,"mismatches":0}],"canonicalForm":{"rule":"replace each character with the index of its first occurrence","examples":[{"s":"egg","encoding":[0,1,1]},{"s":"add","encoding":[0,1,1]},{"s":"foo","encoding":[0,1,1]},{"s":"bar","encoding":[0,1,2]}],"claim":"two strings are isomorphic exactly when their encodings are equal","verifiedOver":"66430 exhaustive pairs, 0 mismatches","realUse":"it is a hashable key, so grouping 10000 strings into isomorphism classes is one pass instead of 50 million pairwise comparisons","weakness":"no early exit — both encodings are built in full before anything is compared"},"pythonSetOneLiner":{"expression":"len(set(s)) == len(set(t)) == len(set(zip(s, t)))","ideaIsSound":"count distinct characters each side and distinct pairs; all three agreeing means the pairing is a bijection","defect":"zip stops at the shorter string, so unequal lengths slip through","smallestCounterexample":{"s":"a","t":"aa","returns":true,"truth":false},"exhaustive":{"allOrderedPairsUpToLength5":132496,"unequalLengthPairs":66066,"wronglyAccepted":10476,"falseAcceptRateOverUnequalLengths":"15.86%","wrongOnEqualLengthPairs":0,"wrongOnceGuarded":0},"fix":"prefix it with len(s) == len(t)"},"pythonIndexOneLiner":{"expression":"[s.index(c) for c in s] == [t.index(c) for c in t]","correct":true,"defect":"str.index scans to the first occurrence, so cost depends on the character distribution","on26LetterAlphabet":"effectively linear — 205.68us at n = 4000","onAllDistinctInput":[{"n":500,"us":61.3},{"n":1000,"us":177.7,"growth":"x2.90"},{"n":2000,"us":489.6,"growth":"x2.76"},{"n":4000,"us":1586.2,"growth":"x3.24"},{"n":8000,"us":5287.4,"growth":"x3.33"}],"comparedToDictEncoding":"1550.77us against 619.54us at n = 4000, and diverging","reading":"a linear method doubles; this is heading for 4x, and nothing in the code hints that the alphabet decides"},"benchCpp":{"unit":"microseconds per run, Apple M2, clang -O2","atN50000":[{"shape":"isomorphic","twoMaps":447.23,"twoArrays":51.08,"lastSeen":39.22,"canonical":38.83,"oneWayBug":32.42},{"shape":"binary alphabet, isomorphic","twoMaps":459.84,"twoArrays":60.38,"lastSeen":55.06,"canonical":38.96,"oneWayBug":39.94},{"shape":"differs at the last character","twoMaps":434.03,"twoArrays":49.99,"lastSeen":38.36,"canonical":38.50,"oneWayBug":32.04},{"shape":"differs at the first character","twoMaps":0.11,"twoArrays":0.01,"lastSeen":0.02,"canonical":35.14,"oneWayBug":0.01}],"hashMapVsArray":[{"n":100,"twoMaps":2.973,"twoArrays":0.099,"ratio":"30.1x"},{"n":1000,"twoMaps":10.920,"twoArrays":1.016,"ratio":"10.7x"},{"n":10000,"twoMaps":88.437,"twoArrays":10.031,"ratio":"8.8x"},{"n":50000,"twoMaps":439.156,"twoArrays":51.024,"ratio":"8.6x"}],"canonicalPrice":{"directCheck":50.69,"canonicalCompare":38.77,"ratioOnIsomorphicInput":"0.8x — the canonical form is faster here","buildingOneKey":16.59,"earlyMismatch":{"directCheck":0.01,"canonical":35.14,"ratio":"about 3500x"}},"methodology":"otherwise idle machine"},"benchPython":{"unit":"microseconds per run, CPython 3.13.4, n = 5000","rows":[{"shape":"isomorphic","twoDicts":263.42,"guardedSetOneLiner":185.94,"indexOneLiner":320.26,"canonical":383.84,"translate":149.50},{"shape":"binary alphabet, isomorphic","twoDicts":234.14,"guardedSetOneLiner":163.31,"indexOneLiner":217.61,"canonical":349.74,"translate":100.70},{"shape":"differs at the last character","twoDicts":268.69,"guardedSetOneLiner":187.66,"indexOneLiner":314.53,"canonical":388.70,"translate":150.37},{"shape":"differs at the first character","twoDicts":0.32,"guardedSetOneLiner":183.19,"indexOneLiner":311.13,"canonical":387.76,"translate":142.67}],"inversion":{"onIsomorphicInput":"the dict loop is the slowest correct method","onEarlyMismatch":"the dict loop is 570x faster than the set one-liner","reason":"every C-level method reads both strings in full whatever the answer; only the loop stops"},"rule":"if you expect mostly False answers that fail early, write the loop; if you expect mostly True, push the work into C","fastestCorrect":"str.translate with a table built from zip, at 149.50us, given the same distinct-count guard"},"assertions":["equal lengths, or the answer is false","every character of s maps to exactly one character of t","every character of t is the image of exactly one character of s","the canonical encodings are equal exactly when the strings are isomorphic","the answer is unchanged if s and t are swapped"],"lesson":"the definition's last clause makes the mapping a bijection, and the canonical form that captures it cheaply is also the one that cannot stop early"}
```

<!-- @highlights -->
- The two strings appear as parallel tracks with cells aligned by position, an arrow drawn between each aligned pair as the scan advances.
- Arrows are green when they agree with what has been recorded and red when they contradict it.
- Two panels sit beside the tracks, one for the forward map and one for the backward, filling as arrows are drawn.
- Running "ab" against "aa" leaves the forward panel entirely green while the backward panel turns red on the second character.
- That split frame is held, because everything the one-way check can see is still green.
- Beneath it a two-part bar shows 6,634 accepted, split into 2,134 correct and 4,500 wrong.
- The wrong segment is labelled 67.8% of its yes answers.
- The two map panels are then replaced by a single row of last-seen positions.
- Rerunning the same input shows one equality test per position doing the work both panels were doing, rejecting at the same character.
- The letters then fade out of both tracks, each cell replaced by the index of that character's first occurrence.
- "egg" and "add" visibly become the identical row [0, 1, 1]; "foo" and "bar" become [0, 1, 1] and [0, 1, 2].
- The point lands that the letters were never the content.
- The early-mismatch case is priced right beside it: the direct check lights two cells and stops at 0.01us.
- The canonical form lights all 100,000 cells and takes 35.14us, drawn to scale so the 3,500x is a picture.
- The close is the zip truncation: "a" above "aa", with the zip pairing drawn as a bracket ending after one column.
- The second column of the lower string is left dangling and unpaired while all three set-size counters read 1 with a green tick.
- A length guard then drops in as a gate in front of the whole expression, and the tick becomes a cross.

<!-- @edgeCases -->
- Both strings empty — isomorphic, and the loop never runs, so every formulation returns true by falling through.
- Unequal lengths — always false, and the guard must come before the loop because `zip` and paired iteration silently truncate.
- Single characters, `"a"` and `"b"` — isomorphic; a character mapping to a different character is the ordinary case, not a violation.
- A character mapping to itself, `"ab"` and `"ab"` — isomorphic; identity is a perfectly good bijection.
- `"ab"` and `"aa"` — the smallest case the one-way check gets wrong, and the one worth putting in every test list.
- `"aa"` and `"ab"` — the same violation from the other side, which the forward map catches and the backward one does not.
- All characters distinct on both sides — isomorphic, and the worst case for the `str.index` one-liner.
- All characters identical on both sides — isomorphic, and the case where the maps hold exactly one entry.
- A string against itself — always isomorphic, and the cheapest sanity check that a formulation is not accidentally asymmetric.
- Bytes above 127 with a signed `char` index — negative array subscript and undefined behaviour; the table index must be `unsigned char`.
- Non-Latin-1 text in Java — `char` is a UTF-16 code unit, so a 256-entry table is too small and characters outside the Basic Multilingual Plane need code points.

<!-- @pitfalls -->
- Checking only the `s -> t` direction. Measured over 66,430 exhaustive pairs, 67.8% of the answers this accepts are wrong, and it errs only by saying yes.
- Testing with hand-picked examples. They are almost all genuine isomorphisms, which is exactly the input the one-way bug cannot fail on.
- Using the Python one-liner without a length guard. `zip` truncates, so it wrongly accepts 10,476 of the 66,066 unequal-length pairs up to length 5 — a 15.86% false-accept rate.
- Writing `[s.index(c) for c in s]`. It is correct but `str.index` scans, so it grows about 3x per doubling on strings with many distinct characters while looking linear on a 26-letter alphabet.
- Reaching for the canonical form to compare one pair. It cannot exit early, so on a pair differing at the first character it measured 35.14us against 0.01 — about 3,500x.
- Indexing a table with a plain `char`. It is signed on x86 and ARM, so any byte above 127 is a negative subscript.
- Using `0` as the "unseen" sentinel for first-occurrence indices. Position 0 is a real answer; the canonical form needs `-1`, while last-seen can use `0` by storing `i + 1`.
- Comparing arrays with `==` in Java. That compares references, so `canonical(s) == canonical(t)` is false even for identical strings — it must be `Arrays.equals`.
- Reaching for a hash map when the key is a character. Measured 8.6x slower at n = 50,000 and 30.1x at n = 100 than the identical algorithm on a 256-entry array.
- Assuming the C-level Python idioms are strictly better. They read both strings in full, so the plain dict loop is 570x faster on a pair that differs at position 0.
- Using `str.translate` without checking that both sides have the same number of distinct characters. The table is built from `zip`, which happily encodes a many-to-one renaming.

<!-- @doubt -->
### Why do I need two maps? Checking `s -> t` seems like enough.

<!-- @answer -->
Because the definition forbids two characters mapping to the same character, which makes the mapping a bijection rather than a lookup table. The one-way check accepts `s = "ab"`, `t = "aa"`: `a -> a` and then `b -> a`, with nothing to object. But `"aa"` cannot be renamed back into `"ab"`, so they are not isomorphic. This is not a rare edge case — measured over all 66,430 ordered pairs of equal-length strings up to length 5 on a three-letter alphabet, the one-way check says yes 6,634 times and is wrong on 4,500 of them. **67.8% of its positive answers are wrong.** It only ever errs by saying yes, which is why hand-picked examples never catch it: the examples people write down are mostly genuine isomorphisms.

<!-- @doubt -->
### Is the `len(set(s)) == len(set(t)) == len(set(zip(s, t)))` one-liner correct?

<!-- @answer -->
The idea is correct and the code is not, by exactly one guard. Counting distinct characters on each side and distinct pairs across, and requiring all three to agree, really is a bijection test — over all 66,430 equal-length pairs up to length 5 it matches the definition with zero mismatches. The problem is that `zip` stops at the shorter argument. So `s = "a"`, `t = "aa"` gives all three counts as 1 and returns `True` for strings of different lengths. Exhaustively over 132,496 ordered pairs, the unguarded version wrongly accepts 10,476, every one of them an unequal-length pair — a 15.86% false-accept rate on that subset. Write `len(s) == len(t) and len(set(s)) == len(set(t)) == len(set(zip(s, t)))` and the error count is zero.

<!-- @doubt -->
### What is the last-seen-index trick actually doing?

<!-- @answer -->
Collapsing both directions of the bijection into one comparison. Instead of storing what each character maps to, store where each character was last seen. At every position, `s[i]` and `t[i]` must have last appeared at the same index — because if they correspond under a bijection they have always occurred together, and if they have always occurred together they correspond. A violation in *either* direction breaks that equality: if `s[i]` was previously paired with something else its last-seen differs, and if `t[i]` was previously paired with something else its last-seen differs. One test, both directions. Store `i + 1` rather than `i` so that `0` can mean "never seen" without a separate flag. Measured 39.22 microseconds at n = 50,000 against 51.08 for the two-table version.

<!-- @doubt -->
### When is the canonical form worth it?

<!-- @answer -->
When you are grouping, never when you are comparing two strings. Rewriting each character as the index of its first occurrence produces a value that is equal for exactly the isomorphic strings — verified over 66,430 pairs with no mismatches — and that value is **hashable**. So sorting 10,000 strings into isomorphism classes is one pass and a hash map, where the pairwise predicate would be about 50 million comparisons. For a single pair it is strictly worse, because a canonical form has to read all of its input before it can say anything: on a pair that differs at the first character it measured 35.14 microseconds against 0.01 for the direct check, about 3,500x. Curiously it is the *faster* of the two on genuinely isomorphic input, at 38.83 against 51.08, because building two arrays and comparing them vectorises where the branchy table check does not.

<!-- @doubt -->
### Why is a 256-entry array so much faster than a hash map?

<!-- @answer -->
Because the key is a character and a character is already an index. A hash map computes a hash, selects a bucket, and follows a pointer to reach a location that `table[c]` reaches with an addition. It also allocates, where two 256-byte tables are stack memory that fits in a handful of cache lines and stays hot for the whole scan. Measured on the identical algorithm: 8.6x at n = 50,000, and 30.1x at n = 100 where the map's construction cost has nothing to amortise against. The rule generalises past this problem — whenever the key space is small and dense, indexing beats hashing, and character problems are the canonical case of a small dense key space.

<!-- @doubt -->
### Which Python version should I write?

<!-- @answer -->
It depends on what your answers look like, and the gap is large in both directions. The plain dict loop is the *slowest* correct method on isomorphic input — 263.42 microseconds at n = 5,000 against 185.94 for the guarded set one-liner and 149.50 for `str.translate`. But it is the only one that stops early, so on a pair differing at position 0 it measured **0.32 against 183.19**, about 570x. Every C-level idiom here reads both strings in full whatever the answer. So: if you expect mostly `False` answers that fail early, write the loop; if you expect mostly `True`, push the work into C. This is the same trade **Longest Common Prefix** measured between vertical scanning and min/max.

<!-- @doubt -->
### Is `[s.index(c) for c in s] == [t.index(c) for c in t]` safe to use?

<!-- @answer -->
It is correct, and its cost depends on your input in a way the code does not reveal. `str.index` scans from the start, so each lookup costs the distance to that character's first occurrence. On a 26-letter alphabet every first occurrence is near the front and it behaves linearly — 205.68 microseconds at n = 4,000, entirely respectable. On strings whose characters are mostly distinct it degrades: measured growth per doubling was x2.90, x2.76, x3.24 and x3.33, where a linear method doubles. At n = 4,000 all-distinct it took 1,550.77 microseconds against 619.54 for the same encoding built with a dict, and the gap widens with size. Build the encoding with `first.setdefault(c, i)` instead — one dict operation per character, no scanning, and no dependence on the alphabet.

<!-- @doubt -->
### Does it matter which string I call `s`?

<!-- @answer -->
No, and that is a useful property to test with. Isomorphism is symmetric: a bijection reversed is still a bijection, so `isIsomorphic(s, t)` and `isIsomorphic(t, s)` must always agree. It is also reflexive — every string is isomorphic to itself — and transitive, which together make it an equivalence relation, and which is what makes the canonical form possible in the first place. The practical value is as a test: the one-way check is *not* symmetric, since it accepts `("ab", "aa")` and rejects `("aa", "ab")`. Feeding a candidate implementation both orders of the same pair is a one-line property test that catches exactly the bug this problem is built around.
