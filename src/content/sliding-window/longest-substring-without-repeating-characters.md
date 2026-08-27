---
id: longest-substring-without-repeating-characters
topic: Sliding Window & Two Pointer
title: Longest Substring Without Repeating Characters
difficulty: Medium
status: ready
prerequisites:
  - longest-subarray-with-given-sum-k-positives
  - check-if-two-strings-are-anagram-of-each-other
  - count-subarrays-with-given-sum
  - time-and-space-complexity-basics
relatedIds:
  - longest-subarray-with-given-sum-k-positives
  - max-consecutive-ones-iii
  - longest-substring-with-at-most-k-distinct-characters
  - sort-characters-by-frequency
  - count-subarrays-with-given-sum
---

<!-- @summary -->
The opening problem of the topic, and the one that establishes why a loop nested inside another loop can still be linear: both pointers only ever move forward, so the left pointer travels a measured **1.00 positions per character** no matter how the inner loop is written. What differs between the two window variants is not distance but bookkeeping — the jump version performs **1.3x to 8.0x fewer** operations depending on alphabet size. Replacing the hash container with a 128-entry array is worth far more than either: **49x to 58x** faster than a `set` and **9x to 14x** faster than a hash map, flat at 790 microseconds per million characters. And the classic bug — forgetting that a remembered index may sit outside the current window — is wrong on **42.50%** of random strings, with `"abba"` as the two-letter counterexample.

<!-- @theory -->
## The problem

Given a string, find the length of the longest substring containing no repeated
character.

```
"abcabcbb"   ->   3    ("abc")
"bbbbb"      ->   1    ("b")
"pwwkew"     ->   3    ("wke", not "pwke" — a subSTRING is contiguous)
```

That last line is the whole trap in the statement. `"pwke"` is a subsequence and
is not admissible.

## The window and its invariant

Keep two indices, `l` and `r`, marking a half-open stretch of the string, and
maintain one property:

> **Invariant:** the characters in `s[l..r]` are all distinct.

The algorithm is then two rules:

```
extend    r moves right by one, taking in s[r]
restore   if the invariant broke, move l right until it holds again
```

Every position `r` therefore ends with a window that is the longest
distinct-character stretch *ending at r*. The answer is the largest of those,
and since every substring ends somewhere, nothing is missed.

```
"abcabcbb"

r=0  a        window "a"      l=0   best 1
r=1  ab       window "ab"     l=0   best 2
r=2  abc      window "abc"    l=0   best 3
r=3  a again  window "bca"    l=1   best 3
r=4  b again  window "cab"    l=2   best 3
r=5  c again  window "abc"    l=3   best 3
r=6  b again  window "cb"     l=5   best 3
r=7  b again  window "b"      l=7   best 3
```

## Why the nested loop is not quadratic

This is the idea the whole topic rests on, and it is worth being precise rather
than waving at "amortised".

`r` advances exactly `n` times. `l` never decreases, and it never passes `r`. So
across the entire run, `l` can advance at most `n` times in total — not `n` times
*per* `r`. The inner `while` looks like it multiplies the work; it does not,
because its total trip count over the whole algorithm is bounded by how far one
monotone pointer can travel.

Measured at n = 1,000,000, total left-pointer movement:

```
alphabet  2   999,998 positions   1.00 per character
alphabet  4   999,997 positions   1.00 per character
alphabet 26   999,993 positions   1.00 per character
alphabet 52   999,987 positions   1.00 per character
```

One position per character, on every input. The two pointers together perform at
most `2n` moves, which is what "O(n) despite the nested loop" actually means.

## Two ways to restore the invariant

**Shrink.** Hold the window's characters in a set. While the incoming character
is already present, remove `s[l]` and advance `l` one step. Simple, and it makes
the invariant visibly true at every moment.

**Jump.** Remember the last index at which each character appeared. When `s[r]`
repeats, `l` can move directly past that previous occurrence in a single
assignment — no loop at all.

Both move `l` the same total distance, as the table above shows. The difference
is how many operations that distance costs:

```
alphabet   set erases   map jumps   ratio
   2          999,998     749,962    1.3x
   4          999,997     554,319    1.8x
  26          999,993     234,034    4.3x
  52          999,987     167,976    6.0x
  95          999,989     124,906    8.0x
```

The saving grows with the alphabet, and the reason is worth naming: with a large
alphabet the window is long, so a single repeat forces `l` to leap a long way —
which the shrink version pays for one erase at a time, and the jump version pays
for once. With a two-letter alphabet the window is never longer than 2, so
there is almost nothing to leap and the two converge.

## The bug that this problem is famous for

The jump is only valid if the remembered index is **inside the current window**.
A character may have appeared long ago and already been left behind, in which
case jumping to it moves `l` *backwards* — which breaks the invariant that made
the linear argument work in the first place.

```
if (last.count(c))              l = last[c] + 1;     // wrong
if (last.count(c) && last[c] >= l)  l = last[c] + 1; // right
```

Measured over 50,000 random strings, the unguarded version is wrong on
**42.50%** of them (42.11% in an independent Python run). The smallest
counterexample is four characters:

```
"abba"

r=0 'a'   l=0   window "a"
r=1 'b'   l=0   window "ab"    best 2
r=2 'b'   repeat inside the window, l jumps to 2, window "b"
r=3 'a'   last['a'] = 0, which is BEFORE l = 2 — the 'a' is already gone

  guarded:   l stays 2, window "ba", answer 2   correct
  unguarded: l = 0 + 1 = 1, window "bba", answer 3   and "bba" repeats 'b'
```

The unguarded answer is not merely too large — it names a window that violates
the invariant outright.

## What the container costs

All three approaches below are O(n). Measured at n = 1,000,000, best of eleven
runs with each alphabet timed in both orders:

```
alphabet   set-shrink      map-jump     array-jump   set/array   map/array
   2       38,801,333 ns  6,984,792 ns   789,584 ns     49.1x        8.8x
   4       43,171,958 ns 10,964,625 ns   791,708 ns     54.5x       13.8x
  26       40,605,333 ns 11,423,333 ns   791,875 ns     51.3x       14.4x
  52       45,510,584 ns  7,132,209 ns   790,917 ns     57.5x        9.0x
  95       46,228,666 ns  9,189,875 ns   790,375 ns     58.5x       11.6x
```

The array version is flat at about 790 microseconds regardless of alphabet, and
it is roughly **fifty times** faster than the set version. That is a far larger
effect than the algorithmic refinement from shrink to jump — which is the point
worth taking away. The interesting choice in this problem is not shrink-versus-
jump; it is hash-versus-array.

The reason is that the "hash" of a character is the character. An `unordered_map`
computes a hash, masks it into a bucket, follows a pointer, and compares a key —
to retrieve something that a plain array retrieves with one indexed load. When
the key space is 128 values wide, a hash table is a data structure solving a
problem that does not exist.

**In Python none of this holds.** At the same size:

```
alphabet   set-shrink   map-jump   array-jump
   2         100.0 ms     89.3 ms      80.5 ms
  26         126.0 ms     89.7 ms      72.8 ms
  95         123.1 ms     87.3 ms      69.9 ms
```

The 50x gap collapses to about 1.7x, because in CPython the interpreter overhead
of the loop dwarfs the container: `ord(c)` plus a list index is not meaningfully
cheaper than a dict lookup when both are dominated by bytecode dispatch. This is
the same shape of result as elsewhere in the knowledge base — a speedup that
comes from memory layout belongs to the platform, while a speedup that comes
from doing fewer operations travels.

## The brute force is not quadratic here

The obvious approach — start at each index and extend while characters stay
distinct — is usually labelled O(n^2). Measured, it is not, and the reason is
structural.

The inner loop stops at the first repeat, and a window of distinct characters
cannot be longer than the alphabet. With ASCII input that is 128, so the inner
loop is bounded by a constant and the whole thing is O(n x alphabet) — linear in
`n`. Measured at n = 100,000:

```
alphabet   comparisons   per character   answer
   2           250,109        2.50          2
   4           321,466        3.21          4
  26           708,781        7.09         23
  95         1,288,153       12.88         43
```

Comparisons per character track the answer, not `n`. Against the array window it
is only 8.0x to 10.3x slower — noticeable, not catastrophic.

The genuine quadratic needs an **unbounded** alphabet, so that a window of
distinct symbols can grow with `n`. Over integers rather than characters, with
every element distinct:

```
n =  1,000     500,500 comparisons   1.00 x n^2/2       16,156,416 ns
n =  4,000   8,002,000 comparisons   1.00 x n^2/2      251,016,833 ns
n = 16,000 128,008,000 comparisons   1.00 x n^2/2    3,965,860,917 ns
```

Exactly `n^2/2`, and the time grows sixteenfold when `n` quadruples. So "O(n^2)"
is a correct worst-case statement about the algorithm and a misleading
description of what it does on the input this problem actually specifies. Both
facts are worth holding at once.

<!-- @intuition -->
Keep a window whose characters are all distinct, push its right edge forward one character at a time, and pull the left edge up only as far as needed to restore that property. Because neither edge ever moves backwards, the inner loop's *total* trip count over the whole run is bounded by `n` rather than repeated per position — measured at exactly 1.00 left-pointer moves per character. The container holding the window matters more than the strategy for shrinking it: a 128-entry array beats a hash set by about fifty times.

<!-- @approach -->
### Brute force — extend from every starting index

<!-- @idea -->
For each start, walk forward while the characters stay distinct and stop at the first repeat. Correct by definition, and the reference the three window versions were verified against.

<!-- @steps -->
```
1. For each start index i, clear a seen-set.
2. Walk j forward from i; stop as soon as s[j] is already in the set.
3. Otherwise add s[j] and update the best length with j - i + 1.
4. The answer is the largest length found.
```

<!-- @complexity -->
- time: O(n x alphabet) for a bounded alphabet, since the inner loop cannot outrun the number of distinct symbols; O(n^2) only when the alphabet is unbounded
- space: O(alphabet) for the seen-set
- note: Measured 2.50, 3.21, 7.09 and 12.88 comparisons per character at alphabets of 2, 4, 26 and 95 — tracking the answer rather than n, and only 8.0x to 10.3x slower than the array window at n = 100,000. The true quadratic needs distinct symbols throughout: over integers it performs exactly n^2/2 comparisons, taking 16,156,416ns at n = 1,000 and 3,965,860,917ns at n = 16,000. Used as the reference for 50,000 randomised cross-checks in C++ and 30,000 in Python — 0 mismatches.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <string>
using namespace std;

int lengthOfLongestSubstring(const string& s) {
    int n = s.size(), best = 0;

    for (int i = 0; i < n; i++) {
        bool seen[128] = {false};
        for (int j = i; j < n; j++) {
            unsigned char c = s[j];
            if (seen[c]) break;                 // first repeat ends this start
            seen[c] = true;
            best = max(best, j - i + 1);
        }
    }
    return best;
}
```

<!-- @annotations -->
- 9: A fresh 128-byte table per start. That zeroing is itself O(alphabet) per iteration, so this version is O(n x alphabet) even before the inner loop runs — a set would trade the zeroing for allocation.
- 11: `unsigned char` before indexing. Plain `char` is signed on most platforms, so any byte above 127 would index negatively; the cast is what makes the table lookup safe.
- 12: The break is why this is not quadratic on ASCII: a distinct-character run cannot exceed the alphabet, so the inner loop is bounded by a constant.
- 14: j - i + 1 rather than a running counter, because the length is derivable from the two indices and one fewer variable is one fewer thing to get wrong.

<!-- @code java -->
```java
static int lengthOfLongestSubstring(String s) {
    int n = s.length(), best = 0;

    for (int i = 0; i < n; i++) {
        boolean[] seen = new boolean[128];
        for (int j = i; j < n; j++) {
            char c = s.charAt(j);
            if (seen[c]) break;
            seen[c] = true;
            best = Math.max(best, j - i + 1);
        }
    }
    return best;
}
```

<!-- @annotations -->
- 5: new boolean[128] allocates and zero-fills on every start, which is the dominant cost here — hoisting the array out and clearing only the touched entries is a worthwhile change if this version is ever run for real.
- 7: Java's `char` is unsigned 16-bit, so no cast is needed and no negative index is possible — but a char above 127 would still overflow this table, which is why the 128 assumes ASCII. charAt is also bounds-checked on every call; a char[] obtained once via toCharArray removes that check from the inner loop.

<!-- @code python -->
```python
def length_of_longest_substring(s: str) -> int:
    best = 0
    for i in range(len(s)):
        seen = set()
        for j in range(i, len(s)):
            if s[j] in seen:
                break
            seen.add(s[j])
            best = max(best, j - i + 1)
    return best
```

<!-- @annotations -->
- 4: A set rather than a fixed table, because Python strings are Unicode and a 128-entry list would be wrong for any non-ASCII input — the set costs more per lookup and is correct for the whole domain.
- 7: The break is what bounds the inner loop; without it this would scan to the end of the string from every start and genuinely be quadratic.
- 3: Used only as the cross-checking reference — 30,000 randomised strings against the three window versions, 0 mismatches.

<!-- @approach -->
### Sliding window with a set, shrinking one character at a time

<!-- @idea -->
Hold the window's characters in a set. Advance `r` always; whenever the incoming character is already in the set, remove `s[l]` and advance `l` repeatedly until the duplicate is gone. The invariant is visibly true after every single step, which makes this the version to reason about even if it is not the version to ship.

<!-- @steps -->
```
1. l = 0, an empty set, best = 0.
2. For each r: while s[r] is in the set, erase s[l] and advance l.
3. Insert s[r]; the window s[l..r] is now distinct.
4. Update best with r - l + 1.
```

<!-- @complexity -->
- time: O(n) — `r` advances n times and `l` advances at most n times in total, measured at exactly 1.00 positions per character
- space: O(min(n, alphabet)) for the set
- note: The slowest of the three by a wide margin — 38,801,333ns to 46,228,666ns at n = 1,000,000, which is 49x to 58x the array version. It also performs the most bookkeeping: 999,998 erase operations at n = 1,000,000, against the jump version's 124,906 on a 95-character alphabet. Both move the left pointer the same total distance; only the operation count differs.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <string>
#include <unordered_set>
using namespace std;

int lengthOfLongestSubstring(const string& s) {
    unordered_set<char> window;
    int l = 0, best = 0;

    for (int r = 0; r < (int)s.size(); r++) {
        while (window.count(s[r])) {            // restore the invariant
            window.erase(s[l]);
            l++;
        }
        window.insert(s[r]);
        best = max(best, r - l + 1);
    }
    return best;
}
```

<!-- @annotations -->
- 11: The `while`, not an `if`. One incoming character can collide with something deep inside the window, so the left edge may need several steps — an `if` would leave a duplicate behind.
- 12: Erase `s[l]`, the character leaving, never `s[r]`. Erasing the incoming character instead is the mistake that turns this loop infinite, since the condition would then be satisfied immediately and `l` would never move.
- 15: Insert after the loop, not before. Inserting first makes `window.count(s[r])` true immediately and the loop shrinks the window to nothing.
- 16: r - l + 1 is the current window length, and it is checked at every r rather than only when the window grows — the longest window need not be the last one.
- 7: unordered_set<char> over a key space of at most 128 values, which is where the 49x goes: the hash of a character is the character, and the table is machinery for a problem that does not exist.

<!-- @code java -->
```java
import java.util.HashSet;
import java.util.Set;

static int lengthOfLongestSubstring(String s) {
    Set<Character> window = new HashSet<>();
    int l = 0, best = 0;

    for (int r = 0; r < s.length(); r++) {
        while (window.contains(s.charAt(r))) {
            window.remove(s.charAt(l));
            l++;
        }
        window.add(s.charAt(r));
        best = Math.max(best, r - l + 1);
    }
    return best;
}
```

<!-- @annotations -->
- 5: Set<Character> boxes every character, so each contains/add/remove allocates or interns an object — worse again than the C++ hash set, and the strongest argument for the array version in Java specifically.
- 9: s.charAt(r) is evaluated on every loop test; binding it to a local `char c` once before the while removes a bounds-checked call per iteration.
- 10: remove takes the *leaving* character. Passing charAt(r) here compiles, runs, and hangs — the loop condition never becomes false.

<!-- @code python -->
```python
def length_of_longest_substring(s: str) -> int:
    window = set()
    l = 0
    best = 0

    for r, c in enumerate(s):
        while c in window:
            window.discard(s[l])
            l += 1
        window.add(c)
        if r - l + 1 > best:
            best = r - l + 1
    return best
```

<!-- @annotations -->
- 6: enumerate gives the index and the character together, so `c` is bound once rather than re-indexed in the loop test — a real saving in CPython where every subscript is a bytecode.
- 8: discard rather than remove, so a missing key is not an error. It cannot be missing here given the invariant, but discard states that the removal is unconditional rather than checked.
- 11: A comparison and assignment rather than max(), avoiding a function call per character; measured 100.0ms to 126.0ms at n = 1,000,000 against the array version's 69.9ms to 80.5ms.

<!-- @approach -->
### Sliding window with a last-index map, jumping the left pointer

<!-- @idea -->
Remember where each character last appeared. When `s[r]` repeats, the left edge can move past that occurrence in one assignment instead of a loop — provided the remembered index is still inside the window, which is the guard this problem is famous for omitting.

<!-- @steps -->
```
1. l = 0, an empty index map, best = 0.
2. For each r: if s[r] was seen at an index >= l, set l = that index + 1.
3. Record last[s[r]] = r.
4. Update best with r - l + 1.
```

<!-- @complexity -->
- time: O(n) — one map lookup and one store per character, with no inner loop at all
- space: O(min(n, alphabet)) for the index map
- note: Performs 1.3x to 8.0x fewer bookkeeping operations than the shrink version — 124,906 jumps against 999,989 erases on a 95-letter alphabet — while moving the left pointer exactly the same total distance. That translates to 6,984,792ns to 11,423,333ns at n = 1,000,000, roughly four times faster than the set version and still 8.8x to 14.4x slower than the array. Dropping the `>= l` guard is wrong on 42.50% of random strings, with "abba" as the four-character counterexample.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <string>
#include <unordered_map>
using namespace std;

int lengthOfLongestSubstring(const string& s) {
    unordered_map<char, int> last;              // character -> index last seen
    int l = 0, best = 0;

    for (int r = 0; r < (int)s.size(); r++) {
        auto it = last.find(s[r]);
        if (it != last.end() && it->second >= l)
            l = it->second + 1;                 // jump past the old occurrence
        last[s[r]] = r;
        best = max(best, r - l + 1);
    }
    return best;
}
```

<!-- @annotations -->
- 12: `it->second >= l` is the guard. Without it a character last seen before the window began drags `l` backwards, breaking the monotonicity the linear argument depends on — wrong on 42.50% of random strings, and "abba" returns 3 for a window that contains two b's.
- 13: `+ 1` puts `l` one past the duplicate, not on it. Landing on it leaves the repeat inside the window.
- 14: The store happens unconditionally, on every character, whether or not a jump occurred — a common slip is to put it inside the `if`, which then remembers only repeated characters.
- 11: `find` once rather than `count` followed by `operator[]`, which would hash the same key twice and, worse, insert a zero for characters never seen.
- 10: There is no inner loop here at all, yet the total left-pointer distance is identical to the shrink version's — the saving is operations, not traversal.

<!-- @code java -->
```java
import java.util.HashMap;
import java.util.Map;

static int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> last = new HashMap<>();
    int l = 0, best = 0;

    for (int r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        Integer prev = last.get(c);
        if (prev != null && prev >= l) l = prev + 1;
        last.put(c, r);
        best = Math.max(best, r - l + 1);
    }
    return best;
}
```

<!-- @annotations -->
- 10: `Integer prev` rather than an int, so "never seen" is representable as null; using getOrDefault(c, -1) is the tidier alternative and avoids the unboxing on the next line.
- 11: `prev >= l` unboxes prev before comparing, which is safe only because the null check short-circuits first — reversing the two clauses throws NullPointerException.
- 12: put is unconditional. Placing it inside the branch above records only characters that caused a jump, which silently loses every first occurrence.

<!-- @code python -->
```python
def length_of_longest_substring(s: str) -> int:
    last = {}
    l = 0
    best = 0

    for r, c in enumerate(s):
        prev = last.get(c, -1)
        if prev >= l:
            l = prev + 1
        last[c] = r
        if r - l + 1 > best:
            best = r - l + 1
    return best
```

<!-- @annotations -->
- 7: `last.get(c, -1)` folds "never seen" into the same comparison as "seen before the window", since -1 is below every valid `l`. That removes the separate null check the Java version needs.
- 8: The single most important line in the file. `prev >= l`, not just `prev` being present — measured 42.11% wrong in Python without it, matching the 42.50% measured in C++.
- 10: Unconditional store, outside the `if`. Indenting this one line into the branch is a bug that still returns the right answer on strings with no repeats at all.

<!-- @approach -->
### Sliding window with a fixed 128-entry array

<!-- @idea -->
The keys are characters, and there are at most 128 of them. Replace the hash container with a plain array indexed by the character code: same algorithm, same jump, same guard — one indexed load instead of a hash, a mask, a pointer chase and a key comparison.

<!-- @steps -->
```
1. last[0..127] all set to -1, l = 0, best = 0.
2. For each r: if last[s[r]] >= l, set l = last[s[r]] + 1.
3. Store last[s[r]] = r.
4. Update best with r - l + 1.
```

<!-- @complexity -->
- time: O(n), with the smallest constant of the three — measured flat at about 790,000ns per million characters regardless of alphabet
- space: O(1) — 128 integers, independent of the input
- note: 49.1x to 58.5x faster than the set version and 8.8x to 14.4x faster than the hash map, and notably *flat*: 789,584ns to 791,875ns across alphabets from 2 to 95, where both hash versions swing by 60% or more. The initialisation to -1 rather than 0 is what removes the special case for characters never seen. In Python the advantage largely evaporates — 69.9ms to 80.5ms against the map version's 87.3ms to 89.7ms, about 1.2x rather than 12x — because interpreter dispatch, not the container, is the cost there.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <string>
using namespace std;

int lengthOfLongestSubstring(const string& s) {
    int last[128];
    fill(last, last + 128, -1);                 // -1 = never seen
    int l = 0, best = 0;

    for (int r = 0; r < (int)s.size(); r++) {
        unsigned char c = s[r];
        if (last[c] >= l) l = last[c] + 1;      // same jump, same guard
        last[c] = r;
        best = max(best, r - l + 1);
    }
    return best;
}
```

<!-- @annotations -->
- 7: -1 rather than 0, so "never seen" compares below every valid `l` and needs no separate branch. Filling with 0 would make character 0 at index 0 indistinguishable from an absent one.
- 11: `unsigned char`, so bytes above 127 do not index negatively. This is the line that decides the table is safe for the stated ASCII input and unsafe for arbitrary bytes.
- 12: The identical guard as the hash version — `>= l`, not merely "present". Changing the container changes nothing about the correctness argument.
- 13: The store is unconditional and outside the branch, exactly as in the map version.
- 6: 128 ints is 512 bytes, which fits in L1 permanently. That is the entire reason this measures 50x faster than the set: the whole lookup table is one or two cache lines.

<!-- @code java -->
```java
static int lengthOfLongestSubstring(String s) {
    int[] last = new int[128];
    java.util.Arrays.fill(last, -1);
    int l = 0, best = 0;

    char[] a = s.toCharArray();                 // one bounds check, not n
    for (int r = 0; r < a.length; r++) {
        char c = a[r];
        if (last[c] >= l) l = last[c] + 1;
        last[c] = r;
        best = Math.max(best, r - l + 1);
    }
    return best;
}
```

<!-- @annotations -->
- 6: toCharArray copies once and then indexes without the per-call bounds check that charAt carries, which matters more here than in the slower versions because there is so little else in the loop.
- 3: Arrays.fill is required because new int[128] zero-fills, and 0 is a legitimate index — the sentinel has to be negative.
- 9: Java's char is unsigned, so no cast is needed; but a char above 127 still indexes out of bounds and throws, which is the honest failure mode rather than the silent corruption C++ would give.

<!-- @code python -->
```python
def length_of_longest_substring(s: str) -> int:
    last = [-1] * 128
    l = 0
    best = 0

    for r, c in enumerate(s):
        o = ord(c)
        if last[o] >= l:
            l = last[o] + 1
        last[o] = r
        if r - l + 1 > best:
            best = r - l + 1
    return best
```

<!-- @annotations -->
- 2: [-1] * 128 assumes ASCII. For arbitrary Unicode this raises IndexError on the first character above 127 — the dict version is the correct choice there, and the trade is explicit rather than hidden.
- 7: ord(c) is a function call per character, which is why the array version's advantage in Python is about 1.2x rather than C++'s 12x: the interpreter, not the container, is the bottleneck.
- 12: Measured 69.9ms to 80.5ms at n = 1,000,000 against the C++ version's 0.79ms — the algorithm is identical and the two-orders-of-magnitude gap is entirely the runtime.

<!-- @example -->

<!-- @input -->
```
s = "abcabcbb"
```

<!-- @output -->
```
3
```

<!-- @why -->
The canonical case, and the one that shows the window sliding rather than growing. The answer is reached at r = 2 and never beaten, but the window keeps moving for the remaining five characters — so an implementation that stops early, or that only checks the length when the window grows, still gets this one right and fails elsewhere.

<!-- @walkthrough -->
- r = 0, 'a': never seen, window "a", best 1.
- r = 1, 'b': never seen, window "ab", best 2.
- r = 2, 'c': never seen, window "abc", best 3 — the answer, found a quarter of the way in.
- r = 3, 'a': last seen at 0, which is at or after l = 0, so l jumps to 1. Window "bca", length 3.
- r = 4, 'b': last seen at 1, at or after l = 1, so l jumps to 2. Window "cab", length 3.
- r = 5, 'c': last seen at 2, so l jumps to 3. Window "abc", length 3.
- r = 6, 'b': last seen at 4, so l jumps to 5. Window "cb", length 2.
- r = 7, 'b': last seen at 6, so l jumps to 7. Window "b", length 1. Answer stays 3.

<!-- @example -->

<!-- @input -->
```
s = "abba"
```

<!-- @output -->
```
2   (without the guard: 3)
```

<!-- @why -->
The four-character counterexample for the missing-guard bug, found by exhaustive enumeration over strings of length up to 6. It is the shortest input where a character's remembered index has already fallen out of the window, and the unguarded version does not merely overcount — it reports a window containing two b's.

<!-- @walkthrough -->
- r = 0, 'a': window "a", last = {a:0}, best 1.
- r = 1, 'b': window "ab", last = {a:0, b:1}, best 2.
- r = 2, 'b': last['b'] = 1, which is at or after l = 0, so l jumps to 2. Window "b", best still 2.
- r = 3, 'a': last['a'] = 0. This is **before** l = 2 — that 'a' is already outside the window.
- Guarded: 0 >= 2 is false, so l stays at 2. Window "ba", length 2. Correct.
- Unguarded: l = 0 + 1 = 1. Window is s[1..3] = "bba", reported length 3 — and it contains two b's, so it violates the invariant outright.
- Measured across 50,000 random strings, the unguarded version is wrong on 42.50%; an independent Python run gave 42.11%.

<!-- @example -->

<!-- @input -->
```
n = 1,000,000 characters, varying only the alphabet size
```

<!-- @output -->
```
left-pointer distance is 1.00 per character in every case; bookkeeping operations differ 1.3x to 8.0x
```

<!-- @why -->
The measurement that separates the two window strategies, and it shows that the usual explanation is imprecise. Shrinking and jumping move the left pointer exactly the same total distance — that is forced by the pointer being monotone. What differs is how many operations that distance costs, and the gap widens with the alphabet because a larger alphabet means a longer window and therefore a longer leap per repeat.

<!-- @walkthrough -->
- Alphabet 2: 999,998 set erases against 749,962 map jumps — a ratio of 1.3. The window is never longer than 2, so there is almost nothing to leap over.
- Alphabet 4: 999,997 against 554,319, a ratio of 1.8.
- Alphabet 26: 999,993 against 234,034, a ratio of 4.3, with a longest window of 21.
- Alphabet 52: 999,987 against 167,976, a ratio of 6.0, longest window 32.
- Alphabet 95: 999,989 against 124,906, a ratio of 8.0, longest window 43.
- In every one of those rows the *distance* travelled by `l` was 999,98x positions — essentially 1.00 per character. The erase count equals the distance because each erase advances `l` by one; the jump count is lower because one jump can cover many positions.

<!-- @example -->

<!-- @input -->
```
all elements distinct, over integers rather than characters
```

<!-- @output -->
```
exactly n^2/2 comparisons — 3,965,860,917 ns at n = 16,000, against 790,375 ns
for the array window on a million ASCII characters
```

<!-- @why -->
The input on which the brute force is genuinely quadratic, and it cannot be built from ASCII. A distinct-character window cannot exceed the alphabet, so with 128 possible bytes the inner loop is bounded by a constant and the brute force is linear in `n`. Only an unbounded symbol set lets the window — and therefore the inner loop — grow with the input.

<!-- @walkthrough -->
- On ASCII input the brute force measured 2.50 to 12.88 comparisons per character across alphabets of 2 to 95 — a constant factor, tracking the answer rather than `n`.
- Against the array window that is only 8.0x to 10.3x, which is noticeable but not the thousand-fold gap "O(n^2) versus O(n)" suggests.
- Over integers with every element distinct, the inner loop runs to the end of the array from every start: exactly n^2/2 comparisons, measured at 1.00x that figure for n = 1,000, 4,000 and 16,000.
- Times were 16,156,416ns, 251,016,833ns and 3,965,860,917ns — quadrupling `n` multiplies the time by about sixteen, which is the signature of a quadratic.
- So "the brute force is O(n^2)" is a true statement about the algorithm and a misleading description of its behaviour on this problem's stated input.
- Both facts matter: the bound is what you must not rely on being loose, and the measurement is what tells you how much a rewrite actually buys.

<!-- @visualization array -->

<!-- @description -->
Open by drawing the string as a row of character cells with two markers, `l` and `r`, both at index 0, and a shaded band between them labelled "all distinct". Advance `r` one cell at a time. When the incoming character is new, simply extend the shade and tick a length counter. When it repeats, freeze for a beat and show the two strategies side by side in separate lanes on the same string: the shrink lane pulls `l` rightward one cell at a time, flashing each removed character, with an erase counter incrementing per step; the jump lane draws a single arc from `l` straight to one past the previous occurrence, with a jump counter incrementing by one. Keep a third counter under both lanes showing total left-pointer *distance*, and let it advance identically in both — that identity is the point, so make the two distance counters visibly lockstep while the operation counters diverge. Run "abcabcbb" through to the end so it is clear the answer 3 is found at r = 2 and the window keeps sliding for five more characters without improving. Then the guard panel, on "abba": step to r = 3, highlight the remembered index of 'a' at position 0, and draw it clearly *outside* the current window with l at 2. Show the guarded branch declining to move and the unguarded branch dragging `l` backwards to 1 — then shade the resulting window "bba" in red and circle its two b's, captioned "not just too long: not distinct". Put 42.50% beside it. Next the container panel: three lanes performing the identical algorithm, with a set, a hash map and a 128-cell array drawn as an actual strip of 128 numbered cells. Animate one lookup in each — the set and map showing hash, mask, pointer-chase and key-compare; the array showing a single indexed load into a strip small enough to draw whole. Beneath, a bar chart at n = 1,000,000 with set at 38.8ms, map at 7.0ms and array at 0.79ms, and a note that the array bar does not move as the alphabet slider is dragged from 2 to 95 while the other two swing by 60%. Close with the complexity panel: the brute force running on ASCII with its inner loop visibly stopping after a handful of steps and a counter reading 12.88 comparisons per character, beside the same code on all-distinct integers where the inner loop runs to the end of the array every time and the counter reads n/2 — captioned "the same code, linear on the stated input and quadratic only when the alphabet is unbounded".

<!-- @sampleInput -->
```json
{"problem":{"input":"abcabcbb","answer":3,"statement":"length of the longest substring with no repeated character","trap":{"input":"pwwkew","answer":3,"correct":"wke","wrong":"pwke","why":"pwke is a subsequence; a substring must be contiguous"}},"invariant":{"statement":"the characters in s[l..r] are all distinct","rules":["extend: r moves right by one, taking in s[r]","restore: if the invariant broke, move l right until it holds again"],"whyComplete":"every position r ends with the longest distinct stretch ENDING at r, and every substring ends somewhere"},"whyLinear":{"claim":"the nested while loop does not make this quadratic","argument":"r advances exactly n times; l never decreases and never passes r, so l advances at most n times IN TOTAL rather than n times per r","measuredLeftPointerDistance":[{"alphabet":2,"positions":999998,"perChar":1.0},{"alphabet":4,"positions":999997,"perChar":1.0},{"alphabet":26,"positions":999993,"perChar":1.0},{"alphabet":52,"positions":999987,"perChar":1.0}],"conclusion":"the two pointers together perform at most 2n moves"},"trace":{"input":"abcabcbb","steps":[{"r":0,"c":"a","l":0,"window":"a","best":1},{"r":1,"c":"b","l":0,"window":"ab","best":2},{"r":2,"c":"c","l":0,"window":"abc","best":3,"note":"the answer, found a quarter of the way in"},{"r":3,"c":"a","lastSeen":0,"l":1,"window":"bca","best":3},{"r":4,"c":"b","lastSeen":1,"l":2,"window":"cab","best":3},{"r":5,"c":"c","lastSeen":2,"l":3,"window":"abc","best":3},{"r":6,"c":"b","lastSeen":4,"l":5,"window":"cb","best":3},{"r":7,"c":"b","lastSeen":6,"l":7,"window":"b","best":3}]},"twoStrategies":{"shrink":"hold the window in a set; while the incoming character is present, erase s[l] and advance l one step","jump":"remember each character's last index; on a repeat, move l past it in one assignment","sameDistance":"both move l the same total distance — that is forced by l being monotone","differentOperations":[{"alphabet":2,"setErases":999998,"mapJumps":749962,"ratio":1.3,"answer":2},{"alphabet":4,"setErases":999997,"mapJumps":554319,"ratio":1.8,"answer":4},{"alphabet":26,"setErases":999993,"mapJumps":234034,"ratio":4.3,"answer":21},{"alphabet":52,"setErases":999987,"mapJumps":167976,"ratio":6.0,"answer":32},{"alphabet":95,"setErases":999989,"mapJumps":124906,"ratio":8.0,"answer":43}],"whyRatioGrows":"a larger alphabet means a longer window, so one repeat forces a longer leap — which shrink pays for one erase at a time and jump pays for once"},"theGuard":{"wrong":"if (last.count(c)) l = last[c] + 1;","right":"if (last.count(c) && last[c] >= l) l = last[c] + 1;","wrongPct":42.5,"pythonWrongPct":42.11,"smallestCounterexample":{"input":"abba","guarded":2,"unguarded":3,"why":"at r=3 the remembered 'a' sits at index 0, before l=2 — it is already outside the window, so jumping to it drags l BACKWARDS","unguardedWindow":"bba","note":"not merely too long: the reported window contains two b's, violating the invariant outright"}},"containerCost":{"note":"n = 1,000,000, best of 11, each alphabet timed in both orders","rows":[{"alphabet":2,"setShrinkNs":38801333,"mapJumpNs":6984792,"arrayJumpNs":789584,"setOverArray":49.1,"mapOverArray":8.8},{"alphabet":4,"setShrinkNs":43171958,"mapJumpNs":10964625,"arrayJumpNs":791708,"setOverArray":54.5,"mapOverArray":13.8},{"alphabet":26,"setShrinkNs":40605333,"mapJumpNs":11423333,"arrayJumpNs":791875,"setOverArray":51.3,"mapOverArray":14.4},{"alphabet":52,"setShrinkNs":45510584,"mapJumpNs":7132209,"arrayJumpNs":790917,"setOverArray":57.5,"mapOverArray":9.0},{"alphabet":95,"setShrinkNs":46228666,"mapJumpNs":9189875,"arrayJumpNs":790375,"setOverArray":58.5,"mapOverArray":11.6}],"arrayIsFlat":"789,584 to 791,875ns across alphabets from 2 to 95, while both hash versions swing by 60% or more","why":"the hash of a character is the character; over a 128-value key space a hash table is machinery for a problem that does not exist","headline":"the interesting choice here is not shrink-versus-jump, it is hash-versus-array"},"python":{"n":1000000,"rows":[{"alphabet":2,"setShrinkMs":100.0,"mapJumpMs":89.3,"arrayJumpMs":80.5},{"alphabet":26,"setShrinkMs":126.0,"mapJumpMs":89.7,"arrayJumpMs":72.8},{"alphabet":95,"setShrinkMs":123.1,"mapJumpMs":87.3,"arrayJumpMs":69.9}],"reading":"the 50x gap collapses to about 1.7x — interpreter dispatch dominates the container, so a memory-layout win belongs to the platform while an operation-count win travels"},"bruteForce":{"claimedComplexity":"O(n^2)","actualOnBoundedAlphabet":"O(n x alphabet), which is linear in n","why":"the inner loop stops at the first repeat, and a distinct-character window cannot exceed the alphabet","measured":[{"alphabet":2,"comparisons":250109,"perChar":2.5,"answer":2},{"alphabet":4,"comparisons":321466,"perChar":3.21,"answer":4},{"alphabet":26,"comparisons":708781,"perChar":7.09,"answer":23},{"alphabet":95,"comparisons":1288153,"perChar":12.88,"answer":43}],"versusArrayWindow":[{"alphabet":2,"factor":8.0},{"alphabet":26,"factor":9.5},{"alphabet":95,"factor":10.3}],"trueQuadratic":{"requires":"an unbounded alphabet, so the window can grow with n","builtOver":"distinct integers","rows":[{"n":1000,"comparisons":500500,"timesNSquaredOverTwo":1.0,"ns":16156416},{"n":4000,"comparisons":8002000,"timesNSquaredOverTwo":1.0,"ns":251016833},{"n":16000,"comparisons":128008000,"timesNSquaredOverTwo":1.0,"ns":3965860917}],"reading":"quadrupling n multiplies the time by about sixteen"}},"verification":{"cpp":{"strings":50000,"maxN":15,"alphabets":[2,3,5,26],"reference":"O(n^2) brute force","mismatches":0},"python":{"strings":30000,"mismatches":0}}}
```

<!-- @highlights -->
- The string is drawn as character cells with `l` and `r` markers and a shaded band labelled "all distinct".
- On a new character the shade simply extends and a length counter ticks.
- On a repeat the animation freezes and splits into a shrink lane and a jump lane on the same string.
- The shrink lane pulls `l` one cell at a time, flashing each removed character, with an erase counter.
- The jump lane draws a single arc past the previous occurrence, incrementing a jump counter by one.
- A third counter under both lanes shows total left-pointer distance advancing in visible lockstep.
- That lockstep is the point: distance is identical while the operation counters diverge.
- "abcabcbb" runs to the end, showing the answer 3 found at r = 2 and five more slides that never improve it.
- The guard panel steps "abba" to r = 3 and highlights the remembered 'a' at index 0.
- That index is drawn clearly outside the window, with `l` at 2.
- The unguarded branch drags `l` backwards to 1 and the resulting window "bba" is shaded red.
- Its two b's are circled, captioned "not just too long: not distinct", with 42.50% beside it.
- Three container lanes run the identical algorithm with a set, a hash map, and 128 drawn cells.
- One lookup is animated in each: hash-mask-chase-compare against a single indexed load.
- A bar chart at n = 1,000,000 reads 38.8ms, 7.0ms and 0.79ms.
- Dragging an alphabet slider from 2 to 95 leaves the array bar still while the other two swing 60%.

<!-- @edgeCases -->
- **Empty string** — the loop never runs and the answer is 0. No version needs a guard for it.
- **A single character** — the answer is 1, produced by the first iteration with `l` still at 0.
- **All characters identical**, `"bbbb"` — every step jumps `l` to `r`, the window is always length 1, and the answer is 1.
- **All characters distinct** — `l` never moves, the window grows to the whole string, and the answer is `n`. This is also the brute force's quadratic case when the alphabet is unbounded.
- **`"abba"`** — the shortest input where a remembered index falls outside the window; 2 with the guard, 3 without.
- **`"pwwkew"`** — the statement's own trap: the answer is 3 from `"wke"`, not 4 from the subsequence `"pwke"`.
- **The answer occurring early** — `"abcabcbb"` reaches 3 at r = 2 and slides for five more characters. An implementation that returns as soon as the window stops growing is wrong here.
- **Repeats separated by more than the window** — the case the `>= l` guard exists for; without it these drag the left pointer backwards.
- **Characters above 127** — the array version indexes out of bounds. In C++ with an `unsigned char` cast that is silent corruption; in Java it throws; in Python it raises IndexError. Only the hash versions handle arbitrary Unicode.
- **A window of exactly the alphabet size** — the maximum possible answer for a bounded alphabet, and the reason the brute force cannot be quadratic on ASCII.
- **Very long input with a two-letter alphabet** — the window never exceeds 2, so shrink and jump converge to within 1.3x and the container choice still dominates.

<!-- @pitfalls -->
- **Jumping to a remembered index without checking it is inside the window.** Wrong on 42.50% of random strings, smallest counterexample `"abba"`, and the reported window is not even distinct.
- **Recording the last index only when a jump happened.** Putting the store inside the `if` loses every first occurrence, and still returns the right answer on strings with no repeats.
- **Using `if` instead of `while` in the shrink version.** One incoming character can collide deep inside the window, so a single step may not restore the invariant.
- **Erasing `s[r]` instead of `s[l]` when shrinking.** The loop condition is then satisfied immediately and never terminates.
- **Inserting the incoming character before the shrink loop.** `window.count(s[r])` becomes true at once and the window collapses to nothing.
- **Indexing a 128-entry table with a plain `char` in C++.** `char` is signed on most platforms, so any byte above 127 indexes negatively — the `unsigned char` cast is load-bearing, not decorative.
- **Filling the last-index table with 0 rather than -1.** Character 0 appearing at index 0 becomes indistinguishable from a character never seen.
- **Checking the best length only when the window grows.** The longest window need not be the final one; `"abcabcbb"` reaches its answer at r = 2.
- **Assuming the brute force is catastrophic on this problem.** On ASCII it is 8.0x to 10.3x slower, not thousands — the inner loop is bounded by the alphabet.
- **Assuming the array version's 50x advantage transfers.** In Python it is about 1.2x, because interpreter dispatch, not the container, is the cost.
- **Using `count` then `operator[]` on an `unordered_map` in C++.** That hashes twice, and `operator[]` inserts a zero for characters never seen, quietly corrupting the table.
- **Reaching for a hash container because the keys are characters.** The hash of a character is the character; over a 128-value key space the table is machinery for a problem that does not exist.

<!-- @doubt -->
There is a loop inside a loop. Why is this not O(n^2)?

<!-- @answer -->
Because the inner loop's trip count is bounded across the *whole run*, not per iteration of the outer one. `r` advances exactly `n` times. `l` only ever increases and never passes `r`, so over the entire algorithm `l` can advance at most `n` times in total — no matter how those advances are distributed. A single `r` might trigger fifty inner steps, but then fifty later values of `r` trigger none. Measured at n = 1,000,000, the left pointer moved 999,987 to 999,998 positions on every alphabet tested: exactly 1.00 per character. The two pointers together perform at most `2n` moves, which is the precise content of "linear despite the nested loop". This argument is the foundation of the entire topic, and it works for every window problem where both edges are monotone.

<!-- @doubt -->
Why does the jump version need a guard when the shrink version does not?

<!-- @answer -->
Because the shrink version can only move `l` forward — it advances one step at a time, so `l` is monotone by construction. The jump version computes a *destination* from remembered data, and that destination may lie behind the current position. A character's last occurrence might be far in the past and already outside the window, in which case `l = last[c] + 1` moves the left edge backwards, undoing progress and breaking the invariant. The fix is one comparison: only jump when `last[c] >= l`. Without it the algorithm is wrong on 42.50% of random strings, and on `"abba"` it reports a window of `"bba"`, which contains two b's. The general lesson is that any optimisation replacing a loop with a computed jump has to prove the jump is forward.

<!-- @doubt -->
Both window versions move the left pointer the same total distance. So what does the jump actually buy?

<!-- @answer -->
Operations, not traversal — and that distinction is worth making because it is usually stated loosely. Both are linear in distance: measured 999,98x positions at n = 1,000,000 on every alphabet. What differs is the cost of covering that distance. The shrink version pays one set erase per position, so it performs about 1,000,000 erases. The jump version pays one assignment per *repeat*, which is far fewer: 124,906 jumps on a 95-letter alphabet, a ratio of 8.0x. On a two-letter alphabet the ratio falls to 1.3x, because the window is never longer than 2 and there is nothing to leap over. So the jump's value scales with how far the left edge typically has to travel at once, which is to say with the alphabet.

<!-- @doubt -->
Why is replacing the hash container worth more than improving the algorithm?

<!-- @answer -->
Because the algorithmic refinement saves a constant factor of roughly four and the container change saves a factor of fifty. Measured at n = 1,000,000: the set version takes 38.8 to 46.2 milliseconds, the hash map 7.0 to 11.4, and the 128-entry array 0.79 flat. The array is 49x to 58x faster than the set and 8.8x to 14.4x faster than the map. The reason is that a hash table over characters is doing work that has no purpose — it computes a hash of a value that is already a small integer, masks it into a bucket, follows a pointer and compares a key, all to retrieve what an array retrieves with one indexed load from 512 bytes that never leave L1. The lesson generalises past this problem: when the key space is small and dense, a table indexed directly by the key is not an optimisation, it is the correct data structure.

<!-- @doubt -->
Why is the array version's time flat across alphabet sizes when the others are not?

<!-- @answer -->
Because its work per character is genuinely constant: one indexed load, one compare, one store, regardless of what the character is or how large the window has grown. Measured 789,584 to 791,875 nanoseconds across alphabets from 2 to 95 — a spread of under 0.3%. The hash versions swing by 60% or more over the same range because their cost depends on how full the container is and how the window behaves: a larger alphabet means more distinct keys resident, more buckets touched, and worse locality. The flatness is itself a useful property. An algorithm whose cost does not depend on a property of the data is one you can reason about from the input size alone, which is not true of either hash version here.

<!-- @doubt -->
Is the brute force really O(n^2)?

<!-- @answer -->
As a worst-case bound, yes. As a description of what it does on this problem, no. The inner loop stops at the first repeated character, and a run of distinct characters cannot be longer than the alphabet — so with ASCII input the inner loop is bounded by 128 and the whole thing is O(n x alphabet), which is linear in `n`. Measured at n = 100,000 it performed 2.50 comparisons per character on a two-letter alphabet and 12.88 on a 95-letter one, tracking the answer rather than the input size, and it ran only 8.0x to 10.3x slower than the array window. To get genuine quadratic behaviour you need an unbounded symbol set: over distinct integers it performs exactly n^2/2 comparisons and takes 16ms, 251ms and 3,966ms at n = 1,000, 4,000 and 16,000. Both statements are worth holding — the bound tells you what you must not rely on, and the measurement tells you what a rewrite actually buys.

<!-- @doubt -->
Should I use the array version or the hash version in an interview?

<!-- @answer -->
Write the hash-map jump version first and say why. It is correct for any character domain including Unicode, it is the version whose correctness argument is easiest to state, and it demonstrates the guard — which is the part of this problem an interviewer is actually probing. Then mention the array as the refinement available when the alphabet is known to be bounded, and give the reason rather than just the fact: the key space is 128 values wide, so a hash is being computed over something that is already an index. That sequence shows you know both the general solution and the specialisation, and that you know which assumption the specialisation depends on. Reaching for the 128-entry array immediately is a smaller answer, because it silently assumes ASCII.

<!-- @doubt -->
What happens to the array version on non-ASCII input?

<!-- @answer -->
It breaks, in three different ways depending on the language, and the difference is instructive. In C++ with the `unsigned char` cast, a byte above 127 indexes past the end of a 128-entry stack array — undefined behaviour, and in practice silent corruption of whatever sits next to it. In Java, `char` is unsigned 16-bit and the bounds check throws `ArrayIndexOutOfBoundsException`, which is loud and immediate. In Python, `ord(c)` for any character above U+007F raises `IndexError` on the list. Only the loud failures are safe. If the input domain is not guaranteed, use the hash map — the correctness of the array version is a claim about the input, not about the algorithm, and it should be stated as one.

<!-- @doubt -->
Why does the answer have to be checked at every position rather than only when the window grows?

<!-- @answer -->
Because the window slides as well as grows, and the longest one is not necessarily the last one. In `"abcabcbb"` the answer of 3 is reached at r = 2, and the algorithm then runs for five more characters during which the window moves repeatedly without ever getting longer. An implementation that only records the length when the window expands, or that returns early once it stops expanding, gets this input right by luck and fails on anything where a long window is followed by a longer one after a contraction. Recording `r - l + 1` unconditionally at every `r` costs one comparison per character and removes the entire class of mistake.

<!-- @doubt -->
The Python numbers barely differ between the three approaches. Does the container choice matter there at all?

<!-- @answer -->
Barely, and the file says so rather than pretending the C++ result carries over. At n = 1,000,000 the three versions measured 100.0/89.3/80.5 milliseconds on a two-letter alphabet and 123.1/87.3/69.9 on a 95-letter one — the 50x C++ gap collapsing to about 1.7x. The reason is that CPython's per-operation overhead dominates everything: `ord(c)` is a function call, a list index is a bytecode, and a dict lookup is also a bytecode, so the difference between them is small relative to the interpreter loop wrapped around both. The general rule this illustrates has come up repeatedly in the knowledge base: a speedup that comes from memory layout belongs to the platform, and a speedup that comes from performing fewer operations travels. The jump-over-shrink improvement is the second kind, and it does show up in Python — 89.3ms against 100.0ms.
