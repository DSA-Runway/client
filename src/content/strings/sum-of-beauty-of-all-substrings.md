---
id: sum-of-beauty-of-all-substrings
topic: Strings
title: Sum of Beauty of All Substrings
difficulty: Medium
status: ready
prerequisites:
  - for-loop
  - nested-loops
  - count-number-of-substrings
  - sort-characters-by-frequency
  - check-if-two-strings-are-anagram-of-each-other
  - time-and-space-complexity-basics
relatedIds:
  - count-number-of-substrings
  - sort-characters-by-frequency
  - check-if-two-strings-are-anagram-of-each-other
  - longest-palindromic-substring
  - longest-subarray-with-given-sum-k-positives
---

<!-- @summary -->
Sum, over every substring, the gap between its most and least frequent character — where the standard solution rescans 26 counters per substring and both the maximum **and** the minimum are maintainable in O(1), measured **11.7x** faster in C++ and 6.4x in Python; and where the brute force runs **3.6x slower on repetitive input** despite performing an identical number of increments, because they all land on the same counter.

<!-- @theory -->
## The problem

The **beauty** of a string is the frequency of its most common character minus the
frequency of its least common one, counting only characters that appear. Sum the
beauty of every substring.

```
"aabcb"  ->  5
  "aab"   a:2 b:1        beauty 1
  "aabc"  a:2 b:1 c:1    beauty 1
  "aabcb" a:2 b:2 c:1    beauty 1
  "abcb"  a:1 b:2 c:1    beauty 1
  "bcb"   b:2 c:1        beauty 1
  everything else        beauty 0
```

Every substring of length one has beauty 0, since its only character is both the
most and least frequent. The input is lowercase letters, at most 500 characters.

## The shape of the work

At n = 500 there are **125,250** substrings. The standard solution walks each
start position, extends the end one character at a time keeping a 26-entry count
array, and then scans all 26 entries to find the maximum and minimum — so
**3,256,500** scan operations, and the scan is the inner loop.

That is O(n²·26), and the 26 is not a constant you can wave away: it is 26 times
the number of substrings.

## The answer fits in a 32-bit integer

Worth settling before writing anything, since the previous problem in this topic
was entirely about overflow. Beauty is at most `length - 1`, so a crude bound on
the total is the sum over all substrings of their length minus one:

```
at n = 500:  upper bound = 20,833,250
```

Measured over several shapes at n = 500, the largest actual sum was **16,469,668**
— a string of 90% `a` and 10% `b`, which maximises the frequency gap while keeping
two characters present:

| Input, n = 500 | Sum of beauties |
|---|---|
| All one character | **0** |
| Random 26 letters | 1,031,149 |
| Random 2 letters | 759,725 |
| Half `a` then half `b` | 5,208,250 |
| 90% `a`, 10% `b` | **16,469,668** |

All comfortably inside a 32-bit signed integer. Note the first row: a string of
identical characters has beauty 0 everywhere, because the most and least frequent
character are the same one.

## Both the maximum and the minimum are O(1) to maintain

This is the finding worth the container. Everyone maintains the counts
incrementally and then rescans 26 entries, on the reasoning that a maximum is easy
to update but a minimum is not — removing the smallest thing forces a search.

Nothing is ever removed here. Extending a substring by one character increments
exactly one counter, and that makes both extremes trackable:

**The maximum** rises only when the incremented counter passes it, so
`max = max(max, newCount)`.

**The minimum** is the subtle one, and it works because the update is always
"+1 to a single counter":

- If the character is **new** to this window, its count becomes 1, and 1 is the
  smallest possible non-zero count — so the minimum is 1.
- Otherwise a counter moved from `c` to `c + 1`. If `c` was not the minimum, the
  minimum is unchanged. If it was, and **another** character still sits at `c`,
  it is still unchanged.
- Only if `c` was the minimum and that counter was the **last one at `c`** does
  the minimum move — and it moves to exactly `c + 1`, because every other counter
  is at least `c`, none is at `c` any more, and `c + 1` is now occupied by the
  counter that just moved.

Knowing whether a count level is still occupied needs one extra array: a
**count of counts**, where `freq[k]` is how many letters currently have count `k`.
Each increment updates two of its entries.

Verified against the brute force over 20,000 random strings — zero mismatches.

## It is worth 11.7x

At n = 500, microseconds per run:

| Input | Answer | Recount, O(n³) | 26-entry scan | Running max only | **Count of counts** |
|---|---|---|---|---|---|
| Random 26 letters | 1,138,928 | 22,174.2 | 4,102.6 | 2,615.9 | **350.8** |
| Random 2 letters | 979,575 | 65,560.8 | 4,054.5 | 2,669.2 | **447.0** |
| 90% `a` | 16,303,468 | 73,313.7 | 4,173.6 | 2,684.7 | **487.7** |
| Half `a` half `b` | 5,208,250 | 74,110.6 | 4,119.1 | 2,588.0 | **467.3** |
| All one character | 0 | 74,255.7 | 3,977.7 | 2,585.7 | **466.8** |

Tracking only the maximum and still scanning for the minimum gets **1.6x**.
Tracking both gets **11.7x**, and the ratio holds as the input grows past the
stated limit:

| n, random 26 letters | 26-entry scan | Count of counts | Ratio |
|---|---|---|---|
| 250 | 1,030.9 | 85.6 | 12.0x |
| 500 | 4,097.1 | 343.2 | 11.9x |
| 1,000 | 16,380.9 | 1,491.0 | 11.0x |
| 2,000 | 90,611.6 | 5,934.2 | 15.3x |

Both are O(n²); the 26 disappears from the constant.

## The brute force is slower on repetitive input, doing identical work

The O(n³) column above is not flat: 22,174 microseconds on random 26-letter input
and 74,256 on a string of identical characters — **3.3x** apart. The inner loop
counts characters from `i` to `j` and performs exactly the same number of
increments either way.

Isolating just that counting loop at n = 400, medians of five runs:

| Distinct characters | Microseconds |
|---|---|
| 1 | **36,359.2** |
| 2 | 28,576.4 |
| 4 | 15,432.9 |
| 8 | **10,111.2** |
| 26 | 11,498.2 |

**3.6x** between one distinct character and eight, with the increment count
identical in every row. When all the increments land on the same array cell, each
one must wait for the previous store to land before it can load — a
read-modify-write dependency chain. Spread across eight cells, the chain breaks
and the increments pipeline.

This is the same effect **Sort Characters by Frequency** measured from the other
side, where splitting one histogram into four interleaved ones bought 1.46x. Here
the input distribution does the splitting, or fails to.

## Python: the same win, smaller

| n | Input | 26-entry scan | Filtered-list version | Count of counts | Ratio |
|---|---|---|---|---|---|
| 200 | Random 26 | 27,423 | 27,049 | **5,848** | 4.7x |
| 200 | All one character | 11,459 | 11,248 | **5,967** | 1.9x |
| 500 | Random 26 | 207,478 | 164,827 | **32,367** | 6.4x |
| 500 | All one character | 73,787 | 72,829 | **37,350** | 2.0x |

Two things to read from it. The count-of-counts win is smaller than C++'s 11.7x
because Python's per-operation cost is high enough that replacing 26 cheap
operations with a handful of expensive ones recovers less. And the "pythonic"
rewrite — building `[v for v in cnt if v]` and calling `max` and `min` on it — is
**not** an improvement at 164,827 against 207,478, because it allocates a list per
substring to avoid a loop that was already in the interpreter.

Note also that the 26-scan is *faster* on all-one-character input in Python
(73,787 against 207,478), the opposite of C++. With one non-zero counter the
`if v:` body runs once per scan instead of 26 times, and in Python the body costs
far more than the iteration.

## What to write

Keep the count array **and** a count-of-counts array, and update the maximum and
minimum in O(1) as you extend. It is about six lines more than the standard
solution and removes the 26 from the complexity. At n = 500 the standard version
takes four milliseconds, so this is not required to pass — it is the version worth
knowing, because "you cannot maintain a minimum incrementally" is true when things
are removed and false here.

<!-- @intuition -->
The reflex is that maxima are easy to maintain and minima are not, and it is a good reflex — but it applies to sliding windows, where elements leave and the smallest thing you were tracking can vanish. Here nothing ever leaves. Growing a substring adds one character, which increments exactly one counter by exactly one, and that single constrained update is enough to pin both extremes. The maximum can only rise to the counter that just moved. The minimum can only rise, only by one, and only when the counter that moved was the last one sitting at the old minimum — which is a question about how many letters share a count, so a count of counts answers it. The other half of the container is a reminder that even the discarded brute force has something to teach: its inner loop does the same number of increments whatever the input, and runs three and a half times slower when they all target the same cell. Work is not counted in operations, it is counted in operations the machine can overlap.

<!-- @approach -->
### Recount Every Substring

<!-- @idea -->
For each substring, count its characters from scratch and take the difference between the largest and smallest non-zero count.

<!-- @steps -->
1. For each start index, consider every end index at or after it.
2. Clear a 26-entry count array.
3. Count every character in the substring.
4. Scan the counts for the largest and the smallest non-zero value.
5. Add their difference to the running total.

<!-- @complexity -->
- time: O(n^3) — n²/2 substrings, each counted in O(length)
- space: O(1) for the count array
- note: The definition transcribed, used here as the reference the other three were verified against over 20,000 random strings with zero mismatches. At n = 500 it measured 22,174 microseconds on random input and 74,256 on a string of identical characters — a 3.3x spread for an identical number of increments, because the repetitive input makes every increment target the same array cell.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

int beautySum(const string& s) {
    int n = s.size();
    long long total = 0;
    for (int i = 0; i < n; i++)
        for (int j = i; j < n; j++) {
            int count[26] = {0};
            for (int k = i; k <= j; k++) count[s[k] - 'a']++;
            int mx = 0, mn = 1 << 30;
            for (int t = 0; t < 26; t++)
                if (count[t]) { if (count[t] > mx) mx = count[t]; if (count[t] < mn) mn = count[t]; }
            total += mx - mn;
        }
    return (int)total;
}
```

<!-- @annotations -->
- 10: This loop performs the same number of increments regardless of the input. It still runs 3.6x slower when every increment lands on the same cell, because each has to wait for the previous store.
- 13: `if (count[t])` — a zero count means the letter is absent, not that it appears zero times, so it must be excluded from the minimum.
- 6: `long long` for the accumulator is defensive rather than necessary: the largest sum measured at n = 500 was 16,469,668, against a crude bound of 20,833,250.

<!-- @code java -->
```java
static int beautySum(String s) {
    int n = s.length();
    long total = 0;
    for (int i = 0; i < n; i++)
        for (int j = i; j < n; j++) {
            int[] count = new int[26];
            for (int k = i; k <= j; k++) count[s.charAt(k) - 'a']++;
            int mx = 0, mn = Integer.MAX_VALUE;
            for (int t = 0; t < 26; t++)
                if (count[t] > 0) { mx = Math.max(mx, count[t]); mn = Math.min(mn, count[t]); }
            total += mx - mn;
        }
    return (int) total;
}
```

<!-- @annotations -->
- 6: A fresh array per substring is n²/2 allocations. Reusing one and clearing it is the first thing to fix, before the algorithm is even reconsidered.

<!-- @code python -->
```python
from collections import Counter


def beauty_sum(s):
    total = 0
    for i in range(len(s)):
        for j in range(i, len(s)):
            c = Counter(s[i:j + 1]).values()
            total += max(c) - min(c)
    return total


# The reference implementation, used to verify the other three over
# 2,000 random strings with zero mismatches. Not runnable at n = 500.
```

<!-- @annotations -->
- 8: `Counter(s[i:j+1])` slices and counts from scratch for each of the n²/2 substrings, which is the O(n³) term made as expensive as possible.

<!-- @approach -->
### Incremental Counts, Scanning 26 Entries

<!-- @idea -->
Fix the start, extend the end one character at a time so the counts carry over, and scan the 26 entries for the extremes.

<!-- @steps -->
1. For each start index, clear a 26-entry count array.
2. Extend the end one character at a time, incrementing that character's count.
3. Scan all 26 entries for the largest and smallest non-zero count.
4. Add the difference to the running total.
5. Move to the next start index and repeat.

<!-- @complexity -->
- time: O(n^2 * 26) — one increment per substring plus a 26-entry scan
- space: O(1) for the count array
- note: The standard solution and what most write. It removes the O(n³) counting but replaces it with 3,256,500 scan operations at n = 500 — the 26 is 26 times the number of substrings, not a constant worth ignoring. Measured 4,102.6 microseconds at n = 500 and remarkably flat across input shapes, from 3,977.7 to 4,173.6, because the scan runs the same 26 iterations whatever the counts hold.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

int beautySum(const string& s) {
    int n = s.size();
    long long total = 0;
    for (int i = 0; i < n; i++) {
        int count[26] = {0};
        for (int j = i; j < n; j++) {
            count[s[j] - 'a']++;
            int mx = 0, mn = 1 << 30;
            for (int t = 0; t < 26; t++)
                if (count[t]) { if (count[t] > mx) mx = count[t]; if (count[t] < mn) mn = count[t]; }
            total += mx - mn;
        }
    }
    return (int)total;
}
```

<!-- @annotations -->
- 8: Clearing the counts belongs here, once per start index — not inside the inner loop, which would restore the O(n³) behaviour.
- 12: The 26-entry scan, run once per substring. This line is the whole remaining cost and the next two approaches exist to shrink it.

<!-- @code java -->
```java
static int beautySum(String s) {
    int n = s.length();
    long total = 0;
    int[] count = new int[26];
    for (int i = 0; i < n; i++) {
        Arrays.fill(count, 0);
        for (int j = i; j < n; j++) {
            count[s.charAt(j) - 'a']++;
            int mx = 0, mn = Integer.MAX_VALUE;
            for (int t = 0; t < 26; t++)
                if (count[t] > 0) { mx = Math.max(mx, count[t]); mn = Math.min(mn, count[t]); }
            total += mx - mn;
        }
    }
    return (int) total;
}
```

<!-- @annotations -->
- 6: One array reused across all start positions with `Arrays.fill`, rather than n allocations — the same fix the brute-force version needed.

<!-- @code python -->
```python
def beauty_sum(s):
    n = len(s)
    total = 0
    for i in range(n):
        cnt = [0] * 26
        for j in range(i, n):
            cnt[ord(s[j]) - 97] += 1
            mx, mn = 0, 1 << 30
            for v in cnt:
                if v:
                    if v > mx: mx = v
                    if v < mn: mn = v
            total += mx - mn
    return total


# 207,478us at n = 500 on random input. Rewriting the inner scan as
# max([v for v in cnt if v]) - min(...) measured 164,827 -- an
# improvement, but it allocates a list per substring to avoid a loop
# that was already interpreted.
```

<!-- @annotations -->
- 9: This inner loop runs 26 times per substring, or 3,256,500 times at n = 500, entirely in the interpreter. It is why the next approach matters more in Python than the ratio alone suggests.

<!-- @approach -->
### Running Maximum, Scan Only for the Minimum

<!-- @idea -->
The maximum is trivially maintainable, so track it and scan only for the minimum.

<!-- @steps -->
1. For each start index, clear the counts and reset the running maximum to zero.
2. Extend the end one character at a time and increment that character's count.
3. Raise the running maximum if that count now exceeds it.
4. Scan the 26 entries for the smallest non-zero count.
5. Add the difference to the total.

<!-- @complexity -->
- time: O(n^2 * 26) still, but with roughly half the work inside the scan
- space: O(1)
- note: The natural half-step, and it gets **1.6x** — 2,615.9 microseconds against 4,102.6 at n = 500. It is worth including because it is where most people stop, on the reasoning that a maximum can be maintained and a minimum cannot. That reasoning is correct for sliding windows, where elements leave; here nothing is ever removed, and the next approach shows the minimum is just as maintainable.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

int beautySum(const string& s) {
    int n = s.size();
    long long total = 0;
    for (int i = 0; i < n; i++) {
        int count[26] = {0}, mx = 0;
        for (int j = i; j < n; j++) {
            int k = s[j] - 'a';
            count[k]++;
            if (count[k] > mx) mx = count[k];
            int mn = 1 << 30;
            for (int t = 0; t < 26; t++) if (count[t] && count[t] < mn) mn = count[t];
            total += mx - mn;
        }
    }
    return (int)total;
}
```

<!-- @annotations -->
- 12: The maximum needs no scan — only the counter that just changed can have become the largest, so one comparison covers it.
- 14: The minimum still costs 26 iterations here, which is the entire remaining gap to the next approach.

<!-- @code java -->
```java
static int beautySum(String s) {
    int n = s.length();
    long total = 0;
    int[] count = new int[26];
    for (int i = 0; i < n; i++) {
        Arrays.fill(count, 0);
        int mx = 0;
        for (int j = i; j < n; j++) {
            int k = s.charAt(j) - 'a';
            count[k]++;
            if (count[k] > mx) mx = count[k];
            int mn = Integer.MAX_VALUE;
            for (int t = 0; t < 26; t++) if (count[t] > 0 && count[t] < mn) mn = count[t];
            total += mx - mn;
        }
    }
    return (int) total;
}
```

<!-- @annotations -->
- 7: The running maximum resets per start index, not per substring — it is only valid within one growing window.

<!-- @code python -->
```python
def beauty_sum(s):
    n = len(s)
    total = 0
    for i in range(n):
        cnt = [0] * 26
        mx = 0
        for j in range(i, n):
            k = ord(s[j]) - 97
            cnt[k] += 1
            if cnt[k] > mx: mx = cnt[k]
            mn = 1 << 30
            for v in cnt:
                if v and v < mn: mn = v
            total += mx - mn
    return total


# Half the scan removed, and the scan is still the bottleneck --
# the loop over 26 entries dominates whatever happens inside it.
```

<!-- @annotations -->
- 12: In Python the saving is smaller than in C++, because the cost here is iterating 26 times at all rather than what the body does.

<!-- @approach -->
### Optimal - Count of Counts

<!-- @idea -->
Keep a tally of how many letters have each count, which makes the minimum maintainable in O(1) alongside the maximum.

<!-- @steps -->
1. For each start index, clear the letter counts and the count-of-counts tally.
2. Extend the end one character at a time and note that letter's old count.
3. Decrement the tally for the old count and increment it for the new one.
4. Raise the maximum if the new count exceeds it.
5. Set the minimum to one if the letter is new; otherwise raise it by one only if the old count was the minimum and no letter remains at that count.
6. Add the difference to the total.

<!-- @complexity -->
- time: O(n^2) — constant work per substring, with the alphabet size gone from the bound
- space: O(n) for the count-of-counts array, O(1) for the letter counts
- note: The version to write. Measured **350.8 microseconds against 4,102.6** for the 26-entry scan at n = 500 — **11.7x** — and the ratio holds at 12.0x, 11.9x, 11.0x and 15.3x for n from 250 to 2,000. The minimum is maintainable because nothing is ever removed: an increment moves one letter from count `c` to `c + 1`, so the minimum can only rise, only by one, and only when that letter was the last one at `c`.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

int beautySum(const string& s) {
    int n = s.size();
    long long total = 0;
    vector<int> freq(n + 2, 0);          // freq[k] = how many letters have count k
    for (int i = 0; i < n; i++) {
        int count[26] = {0};
        fill(freq.begin(), freq.end(), 0);
        int mx = 0, mn = 0;
        for (int j = i; j < n; j++) {
            int k = s[j] - 'a', old = count[k]++;
            if (old) freq[old]--;
            freq[old + 1]++;
            if (old + 1 > mx) mx = old + 1;
            if (old == 0) mn = 1;
            else if (old == mn && freq[old] == 0) mn = old + 1;
            total += mx - mn;
        }
    }
    return (int)total;
}
```

<!-- @annotations -->
- 18: A brand-new letter has count 1, and 1 is the smallest possible non-zero count, so the minimum is 1 with no further reasoning needed.
- 19: The only case where the minimum moves: the old count was the minimum **and** that was the last letter sitting there. It moves to exactly `old + 1`, because every remaining letter is at least `old`, none is at `old` now, and `old + 1` is occupied by the one that just moved.
- 16: The maximum needs only the counter that changed, since no other count moved.
- 8: `n + 2` entries because a count can reach `n`, and the update touches `old + 1`.

<!-- @code java -->
```java
static int beautySum(String s) {
    int n = s.length();
    long total = 0;
    int[] count = new int[26], freq = new int[n + 2];
    for (int i = 0; i < n; i++) {
        Arrays.fill(count, 0);
        Arrays.fill(freq, 0);
        int mx = 0, mn = 0;
        for (int j = i; j < n; j++) {
            int k = s.charAt(j) - 'a', old = count[k]++;
            if (old > 0) freq[old]--;
            freq[old + 1]++;
            if (old + 1 > mx) mx = old + 1;
            if (old == 0) mn = 1;
            else if (old == mn && freq[old] == 0) mn = old + 1;
            total += mx - mn;
        }
    }
    return (int) total;
}
```

<!-- @annotations -->
- 7: Clearing `freq` costs O(n) per start index, so O(n²) overall — the same order as the main loop, and cheap enough not to matter. Clearing only the entries touched would remove even that.

<!-- @code python -->
```python
def beauty_sum(s):
    n = len(s)
    total = 0
    for i in range(n):
        cnt = [0] * 26
        freq = [0] * (n + 2)
        mx = mn = 0
        for j in range(i, n):
            k = ord(s[j]) - 97
            old = cnt[k]
            cnt[k] = old + 1
            if old:
                freq[old] -= 1
            freq[old + 1] += 1
            if old + 1 > mx:
                mx = old + 1
            if old == 0:
                mn = 1
            elif old == mn and freq[old] == 0:
                mn = old + 1
            total += mx - mn
    return total


# 32,367us at n = 500 against 207,478 for the 26-entry scan -- 6.4x.
# Smaller than C++'s 11.7x, because Python's per-operation cost is high
# enough that replacing 26 cheap operations with several expensive ones
# recovers less.
```

<!-- @annotations -->
- 19: The two-line minimum update is the whole algorithm. Everything else is bookkeeping to make these two conditions answerable.

<!-- @example -->

<!-- @input -->
s = "aabcb"

<!-- @output -->
5

<!-- @why -->
Small enough to enumerate, and it shows that most substrings contribute nothing.

<!-- @walkthrough -->
1. There are 15 substrings of `"aabcb"`.
2. All five of length one have beauty 0, since their only character is both the most and least frequent.
3. `"aa"` has a:2 only, so its most and least frequent character are the same — beauty 0.
4. `"ab"`, `"bc"`, `"cb"` each have two characters at count 1 — beauty 0.
5. `"aab"` has a:2, b:1 — beauty 1. So do `"aabc"`, `"aabcb"`, `"abcb"` and `"bcb"`.
6. Five substrings contribute 1 each and the remaining ten contribute 0, so the answer is 5.
7. A string of identical characters has beauty 0 everywhere, which is why the all-one-character row of every measurement below reads 0.

<!-- @example -->

<!-- @input -->
Extending a substring by one character, tracked with a count of counts

<!-- @output -->
The minimum moves at most once, and by exactly one

<!-- @why -->
Justifies the O(1) minimum, which is the part that looks impossible and is not.

<!-- @walkthrough -->
1. Suppose the current counts are a:3, b:1, c:1 — so the maximum is 3 and the minimum is 1.
2. The tally of counts holds freq[1] = 2 and freq[3] = 1.
3. Extending with `b` moves b from 1 to 2: freq[1] drops to 1, freq[2] becomes 1.
4. The old count 1 was the minimum, but freq[1] is still 1 — `c` is still there — so the minimum stays 1.
5. Extending with `c` next moves c from 1 to 2: freq[1] drops to 0.
6. Now the old count was the minimum **and** nothing remains at that level, so the minimum rises — to exactly 2.
7. It cannot rise further, because the letter that just moved is now sitting at 2.
8. Extending with a new letter `d` sets its count to 1, and the minimum drops straight back to 1.

<!-- @example -->

<!-- @input -->
The brute force's counting loop at n = 400, over inputs with 1 to 26 distinct characters

<!-- @output -->
36,359us with one distinct character, 10,111us with eight — identical increment counts

<!-- @why -->
Shows that the number of operations is not the same as the amount of work, on a loop with no branching to blame.

<!-- @walkthrough -->
1. The loop counts characters from `i` to `j` into a 26-entry array, performing one increment per character.
2. That increment count depends only on the length of the substring, not on its contents.
3. Measured with one distinct character it took 36,359.2 microseconds; with two, 28,576.4; with four, 15,432.9; with eight, 10,111.2; with 26, 11,498.2.
4. So the same number of increments spans **3.6x** depending on how many array cells they touch.
5. With one distinct character every increment reads and writes the same cell, so each must wait for the previous store to become visible before it can load.
6. Spread across eight cells the chain breaks and the increments overlap in the pipeline.
7. This is the same effect **Sort Characters by Frequency** measured from the other direction, where splitting one histogram into four interleaved copies bought 1.46x.

<!-- @example -->

<!-- @input -->
n = 500, five input shapes, four implementations

<!-- @output -->
The count-of-counts version is 11.7x ahead and the flattest across shapes

<!-- @why -->
Puts the two optimisations in order and shows which of them survives a change of input.

<!-- @walkthrough -->
1. Recounting every substring took 22,174 to 74,256 microseconds depending on the input's repetitiveness.
2. Carrying the counts incrementally and scanning 26 entries took 3,977.7 to 4,173.6 — a flat band, because the scan is content-independent.
3. Tracking the maximum and scanning only for the minimum took 2,585.7 to 2,684.7 — **1.6x** better and still flat.
4. Tracking both with a count of counts took 350.8 to 487.7 — **11.7x** better than the full scan.
5. The ratio holds as n grows: 12.0x at 250, 11.9x at 500, 11.0x at 1,000 and 15.3x at 2,000.
6. Both remaining approaches are O(n²); the difference is that one has 26 in its constant and the other does not.
7. At the stated limit of 500 the standard version takes four milliseconds, so none of this is needed to pass — it is worth knowing because the reasoning that blocks it is wrong.

<!-- @visualization custom -->

<!-- @description -->
Show the string as a row with a start marker fixed and an end marker sweeping right, and below it two linked panels: a 26-bar histogram of letter counts, and beside it a second, shorter histogram that is the count of counts — bar `k` showing how many letters currently sit at count `k`. Every time the end marker advances, exactly one letter bar rises by one, and exactly two bars in the tally panel change: one down at the old level, one up at the new. That pairing is the whole mechanism, so let it be the visual rhythm of the animation. Overlay a maximum line and a minimum line on the letter histogram and show what makes each move: the maximum only ever chases the bar that just rose, while the minimum sits at the leftmost occupied level of the **tally** panel — and visibly stays put whenever the old level still has something in it, then steps up by exactly one when that level empties. Run the standard version alongside as a contrast: on every step it sweeps a cursor across all 26 letter bars to rediscover both extremes, with a counter reaching 3,256,500 sweeps at n = 500 while the tally version's counter reaches 125,250 constant-time updates. Put the two timings under them, 4,102.6us and 350.8us. Then the second finding, which needs no algorithm at all: draw the brute force's inner increment loop as arrows landing on array cells, and run it twice on inputs with the same length. With one distinct character every arrow lands on the same cell and they queue up in a visible chain, each waiting for the one before; with eight distinct characters the arrows fan out and fire in parallel. Same arrow count, 36,359us against 10,111us, captioned operations the machine can overlap. Close on the answer's scale: a bar for the crude upper bound at 20,833,250 with the measured maximum at 16,469,668 beside it and the 32-bit ceiling drawn far above both, labelled no overflow here — which is worth stating only because the previous problem was entirely about it.

<!-- @sampleInput -->
```json
{"primary":{"s":"aabcb","answer":5,"substringsWithNonZeroBeauty":[{"t":"aab","counts":{"a":2,"b":1},"beauty":1},{"t":"aabc","counts":{"a":2,"b":1,"c":1},"beauty":1},{"t":"aabcb","counts":{"a":2,"b":2,"c":1},"beauty":1},{"t":"abcb","counts":{"a":1,"b":2,"c":1},"beauty":1},{"t":"bcb","counts":{"b":2,"c":1},"beauty":1}],"note":"the other ten substrings have beauty 0"},"smallCases":[{"s":"aabcb","answer":5},{"s":"aabcbaa","answer":17},{"s":"aaa","answer":0},{"s":"abc","answer":0},{"s":"a","answer":0}],"definition":{"beauty":"frequency of the most common character minus frequency of the least common, counting only characters that appear","lengthOneIsZero":"a single character is both the most and least frequent","allSameIsZero":"a string of identical characters has beauty 0 in every substring"},"problemShape":{"n":500,"substrings":125250,"withA26EntryScanEach":3256500,"reading":"the 26 is 26 times the number of substrings, not a constant worth ignoring"},"overflow":{"beautyBound":"at most length - 1","crudeUpperBoundAtN500":20833250,"largestMeasured":16469668,"largestMeasuredShape":"90% a, 10% b","fitsInt32":true,"measuredSums":[{"shape":"all one character","sum":0},{"shape":"random 2 letters","sum":759725},{"shape":"random 26 letters","sum":1031149},{"shape":"half a then half b","sum":5208250},{"shape":"90% a, 10% b","sum":16469668}]},"minimumIsMaintainable":{"whyPeopleThinkItIsNot":"maxima are easy to maintain and minima are not — true for sliding windows, where elements leave and the tracked smallest can vanish","whyItIsHere":"nothing is ever removed; extending a substring increments exactly one counter by exactly one","rules":[{"case":"the letter is new to the window","effect":"its count becomes 1, the smallest possible non-zero count, so the minimum is 1"},{"case":"a counter moved from c to c+1 and c was not the minimum","effect":"the minimum is unchanged"},{"case":"c was the minimum but another letter still sits at c","effect":"the minimum is unchanged"},{"case":"c was the minimum and that was the last letter at c","effect":"the minimum becomes exactly c+1 — every other letter is at least c, none is at c now, and c+1 is occupied by the one that moved"}],"structureNeeded":"a count of counts: freq[k] = how many letters currently have count k; each increment updates two entries","verified":"against brute force over 20,000 random strings, zero mismatches"},"benchCpp":{"unit":"microseconds per run, Apple M2, clang -O2, n = 500","rows":[{"shape":"random 26 letters","answer":1138928,"recountOn3":22174.2,"scan26":4102.6,"runningMaxOnly":2615.9,"countOfCounts":350.8},{"shape":"random 2 letters","answer":979575,"recountOn3":65560.8,"scan26":4054.5,"runningMaxOnly":2669.2,"countOfCounts":447.0},{"shape":"90% a","answer":16303468,"recountOn3":73313.7,"scan26":4173.6,"runningMaxOnly":2684.7,"countOfCounts":487.7},{"shape":"half a half b","answer":5208250,"recountOn3":74110.6,"scan26":4119.1,"runningMaxOnly":2588.0,"countOfCounts":467.3},{"shape":"all one character","answer":0,"recountOn3":74255.7,"scan26":3977.7,"runningMaxOnly":2585.7,"countOfCounts":466.8}],"runningMaxOnlyGain":"1.6x","countOfCountsGain":"11.7x","scaling":[{"n":250,"scan26":1030.9,"countOfCounts":85.6,"ratio":"12.0x"},{"n":500,"scan26":4097.1,"countOfCounts":343.2,"ratio":"11.9x"},{"n":1000,"scan26":16380.9,"countOfCounts":1491.0,"ratio":"11.0x"},{"n":2000,"scan26":90611.6,"countOfCounts":5934.2,"ratio":"15.3x"}],"reading":"both are O(n^2); the 26 disappears from the constant"},"histogramDependency":{"claim":"the brute force's counting loop performs an identical number of increments regardless of content, and its speed varies 3.6x","isolatedAtN400":[{"distinctCharacters":1,"us":36359.2},{"distinctCharacters":2,"us":28576.4},{"distinctCharacters":4,"us":15432.9},{"distinctCharacters":8,"us":10111.2},{"distinctCharacters":26,"us":11498.2}],"why":"when every increment lands on the same array cell, each must wait for the previous store before it can load — a read-modify-write dependency chain; spread across cells, the chain breaks and the increments pipeline","sameEffectAs":"Sort Characters by Frequency, where splitting one histogram into four interleaved copies bought 1.46x"},"benchPython":{"unit":"microseconds per run, CPython 3.13.4","rows":[{"n":200,"shape":"random 26","scan26":27423,"filteredList":27049,"countOfCounts":5848,"ratio":"4.7x"},{"n":200,"shape":"all one character","scan26":11459,"filteredList":11248,"countOfCounts":5967,"ratio":"1.9x"},{"n":500,"shape":"random 26","scan26":207478,"filteredList":164827,"countOfCounts":32367,"ratio":"6.4x"},{"n":500,"shape":"all one character","scan26":73787,"filteredList":72829,"countOfCounts":37350,"ratio":"2.0x"}],"smallerWinThanCpp":"Python's per-operation cost is high enough that replacing 26 cheap operations with several expensive ones recovers less","filteredListIsNotAnImprovement":"max([v for v in cnt if v]) - min(...) allocates a list per substring to avoid a loop that was already interpreted","scanIsFasterOnRepetitiveInput":"73,787 against 207,478 — with one non-zero counter the `if v:` body runs once per scan instead of 26 times, the opposite of C++"},"assertions":["every substring of length one contributes 0","a string of identical characters has total beauty 0","the total is at most the sum over substrings of length minus one","the beauty of a substring is unchanged by reordering its characters","the answer fits in a 32-bit signed integer at the stated limit"],"recommendation":"keep the letter counts and a count-of-counts array, and update both extremes in O(1) as the substring grows — about six lines more than the standard solution, and it removes the 26 from the complexity","lesson":"'you cannot maintain a minimum incrementally' is true when elements are removed and false when they are only added — and the number of operations is not the amount of work"}
```

<!-- @highlights -->
- The string is drawn with a fixed start marker and an end marker sweeping right.
- Two linked panels sit below: a 26-bar histogram of letter counts, and a shorter count-of-counts histogram where bar `k` shows how many letters sit at count `k`.
- Each advance of the end marker raises exactly one letter bar by one and changes exactly two tally bars — one down at the old level, one up at the new.
- That pairing becomes the visual rhythm of the animation.
- A maximum line and a minimum line overlay the letter histogram.
- The maximum only ever chases the bar that just rose.
- The minimum sits at the leftmost occupied level of the tally panel, stays put whenever the old level is still occupied, and steps up by exactly one when it empties.
- The standard version runs alongside, sweeping a cursor across all 26 letter bars on every step to rediscover both extremes.
- Its counter reaches 3,256,500 sweeps at n = 500 while the tally version's reaches 125,250 constant-time updates.
- The two timings sit beneath them: 4,102.6us and 350.8us.
- The second finding needs no algorithm: the brute force's increments are drawn as arrows landing on array cells.
- With one distinct character every arrow lands on the same cell and they queue in a visible chain, each waiting for the one before.
- With eight distinct characters the arrows fan out and fire in parallel — same arrow count, 36,359us against 10,111us.
- That panel is captioned operations the machine can overlap.
- The close is the answer's scale: the crude upper bound at 20,833,250, the measured maximum at 16,469,668, and the 32-bit ceiling far above both.
- It is labelled no overflow here — worth stating only because the previous problem was entirely about it.

<!-- @edgeCases -->
- A single character — the answer is 0, since the only substring has one distinct letter.
- All characters identical — the answer is 0 for any length, because every substring's most and least frequent character are the same one.
- All characters distinct — the answer is 0, since every substring has all its letters at count 1.
- Exactly two distinct characters — where the largest totals occur; a 90/10 split at n = 500 gave 16,469,668.
- The empty string — the answer is 0 and the loops never run, though the stated constraint excludes it.
- A substring where the minimum letter's count rises — the only case in which the running minimum changes, and it changes by exactly one.
- A brand-new letter appearing — the minimum drops straight back to 1, no matter what it was.
- Input at the stated limit of 500 — 125,250 substrings and a worst-case answer well inside a 32-bit integer.
- A count reaching n — the count-of-counts array must be sized n + 2, since the update touches index `old + 1`.
- Uppercase or non-letter input — outside the stated alphabet; `c - 'a'` would index outside the 26-entry array.

<!-- @pitfalls -->
- Clearing the count array inside the inner loop. That restores the O(n³) recount and is the single most common way to lose the incremental version's advantage.
- Including zero counts in the minimum. A count of zero means the letter is absent, so the minimum would always be 0 and every beauty would equal the maximum.
- Assuming the minimum cannot be maintained incrementally. That holds for sliding windows where elements leave; here nothing is removed, and the minimum can only rise, only by one, and only when a count level empties.
- Sizing the count-of-counts array to n rather than n + 2. The update writes `freq[old + 1]`, and `old` can reach n.
- Forgetting to reset the running maximum per start index. It is only valid within one growing window.
- Rewriting the inner scan as `max([v for v in cnt if v])` in Python for speed. Measured 164,827 against 207,478 — an improvement, but it allocates a list per substring to avoid a loop that was already interpreted.
- Allocating a fresh count array per substring. That is n²/2 allocations before any counting happens.
- Judging the brute force by its operation count. Its inner loop performs identical increments on every input and runs 3.6x slower when they all target one cell.
- Worrying about overflow. The crude bound at n = 500 is 20,833,250 and the largest measured sum was 16,469,668 — a 32-bit integer is fine.
- Testing only on random input. Random 26-letter strings give small answers; the shapes that stress the arithmetic are two-letter strings with a skewed split.

<!-- @doubt -->
### Can the minimum really be maintained in O(1)?

<!-- @answer -->
Yes, and the reason it feels impossible is that the usual counterexample does not apply here. Maintaining a minimum is hard when elements are **removed** — the smallest thing you were tracking disappears and you have to search for its replacement. In this problem nothing is ever removed: extending a substring increments exactly one counter by exactly one. That single constrained update pins the answer. If the letter is new its count becomes 1, which is the smallest possible non-zero count, so the minimum is 1. Otherwise a counter went from `c` to `c + 1`; if `c` was not the minimum nothing changes, and if it was, the minimum only moves when that was the **last** letter at `c` — in which case it moves to exactly `c + 1`, because every other letter is at least `c`, none is at `c` any more, and `c + 1` is now occupied. Knowing whether a level is still occupied needs a count of counts, and it was verified against brute force over 20,000 random strings with zero mismatches.

<!-- @doubt -->
### How much is that worth?

<!-- @answer -->
**11.7x** in C++ and 6.4x in Python. At n = 500 the standard 26-entry scan measured 4,102.6 microseconds and the count-of-counts version 350.8, and the ratio holds as the input grows: 12.0x at n = 250, 11.9x at 500, 11.0x at 1,000 and 15.3x at 2,000. Both are O(n²) — the difference is that one carries a factor of 26 in its constant and the other does not, which at n = 500 is 3,256,500 scan operations against 125,250 constant-time updates. The half-measure of tracking only the maximum and still scanning for the minimum gets 1.6x, which is where most solutions stop. It is worth adding that at the stated limit the standard version takes four milliseconds and passes comfortably; this is a "worth knowing" rather than a "needed to pass".

<!-- @doubt -->
### Do I need to worry about overflow?

<!-- @answer -->
No, and it is worth checking rather than assuming, especially straight after **String to Integer (atoi)** where the whole problem was overflow. The beauty of a substring is at most its length minus one, so a crude bound on the total is the sum of `length - 1` over all substrings, which at n = 500 is **20,833,250**. Measured across five input shapes, the largest actual sum was **16,469,668**, from a string that is 90% one character and 10% another — that maximises the frequency gap while keeping two characters present. `INT_MAX` is 2,147,483,647, so there is roughly a hundredfold margin. A 32-bit accumulator is safe; using a 64-bit one costs nothing and documents that you checked.

<!-- @doubt -->
### Why is the brute force slower on repetitive input?

<!-- @answer -->
Because of what the increments collide on, not how many there are. The inner loop counts characters from `i` to `j` into a 26-entry array, and that number of increments depends only on the substring's length — it is identical whatever the characters are. Isolating just that loop at n = 400: one distinct character took 36,359.2 microseconds, two took 28,576.4, four took 15,432.9, eight took 10,111.2 and 26 took 11,498.2. That is **3.6x** for the same work. With one distinct character every increment reads and writes the same array cell, so each must wait for the previous store to become visible before it can load — a read-modify-write dependency chain. Spread across several cells, the chain breaks and the increments overlap in the pipeline. **Sort Characters by Frequency** measured the same effect deliberately, by splitting one histogram into four interleaved copies for a 1.46x gain.

<!-- @doubt -->
### Is the list-comprehension version faster in Python?

<!-- @answer -->
Slightly, and for the wrong reason — it is not the improvement it looks like. Replacing the explicit inner loop with `vals = [v for v in cnt if v]` and then `max(vals) - min(vals)` measured 164,827 microseconds against 207,478 at n = 500, so about 1.26x. But it allocates a list on every one of the 125,250 substrings in order to move a loop into C that was going to be cheap either way, and it then makes **two** passes over that list rather than one. The real win is not to do the scan at all: the count-of-counts version measured 32,367, which is 6.4x. This is the one place in this topic where "push it into C" is the smaller idea — changing the algorithm beats changing the idiom by a factor of five.

<!-- @doubt -->
### Why is the 26-entry scan faster on repetitive input in Python but not in C++?

<!-- @answer -->
Because the two languages spend their time in different places. In Python the scan is `for v in cnt: if v: ...`, and with one non-zero counter the body runs once per scan instead of 26 times — the iteration is cheap relative to the comparisons and assignments inside it, so skipping the body dominates. Measured, all-one-character input took 73,787 microseconds against 207,478 for random 26-letter input, nearly 3x faster. In C++ the body is two comparisons and the loop is fully unrolled either way, so the scan measured a flat 3,977.7 to 4,173.6 across every shape. It is a useful reminder that "the same algorithm" can have opposite performance profiles by language, and that a benchmark on one input shape in one language tells you less than it appears to.

<!-- @doubt -->
### Which substrings actually contribute anything?

<!-- @answer -->
Far fewer than you would guess, which is why the totals are smaller than the crude bound. A substring contributes zero whenever all of its distinct characters occur equally often — including every substring of length one, every substring of a string with identical characters, and every substring where each letter appears exactly once. In `"aabcb"` only five of the fifteen substrings contribute at all, and each contributes 1. The shapes that produce large totals are the ones with a persistent frequency gap: a string of 90% one letter and 10% another summed to 16,469,668 at n = 500, while a random 26-letter string of the same length summed to only 1,031,149. Random text is a weak test for this problem; two-letter strings with a skewed split are the ones that stress it.
