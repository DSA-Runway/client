---
id: reverse-every-word-in-a-string
topic: Strings
title: Reverse every word in a string
difficulty: Medium
status: ready
prerequisites:
  - for-loop
  - if-else-statements
  - reverse-words-in-a-given-string-palindrome-check
  - largest-odd-number-in-a-string
  - remove-outermost-parentheses
  - time-and-space-complexity-basics
relatedIds:
  - reverse-words-in-a-given-string-palindrome-check
  - rotate-string
  - remove-outermost-parentheses
  - longest-palindromic-substring
  - reverse-a-number
---

<!-- @summary -->
Reverse the characters inside each word while leaving the words where they are — the mirror of its sibling problem, which reverses the order and normalises spacing, so the correct split here is the one that was wrong there and **81.5%** of realistically spaced inputs distinguish them; where reversing in place measured **4.8x** faster than splitting and rejoining; and where the identity linking the two problems turns out to be the **fastest Python implementation**, at 2.6x, by replacing n small C calls with three big ones.

<!-- @theory -->
## The problem

Reverse the characters of every word, keeping the words in their original
positions and **preserving the whitespace exactly**.

```
"Let's take LeetCode contest"  ->  "s'teL ekat edoCteeL tsetnoc"
"the sky is blue"              ->  "eht yks si eulb"
"  hello   world  "            ->  "  olleh   dlrow  "
```

Look at the last one. Two leading spaces, three in the middle, two trailing — all
preserved. That is the opposite of what the sibling problem wants.

## It is the mirror of Reverse Words in a Given String

The two problems look almost identical and differ in both of their halves:

| | **Reverse words in a given string** | **Reverse every word** |
|---|---|---|
| What is reversed | the **order** of the words | the **characters** inside each word |
| Whitespace | collapsed to single spaces, ends trimmed | **preserved exactly** |
| Correct Python split | `s.split()` | `s.split(" ")` |

So the split that was the bug there is the fix here. In the sibling container,
`split(" ")` differed from `split()` on 80.7% of realistically spaced input and
was wrong; here the same comparison differs on **81.5%** — 163,060 of 200,000
generated inputs — and `split(" ")` is the correct one, because it is the only
version that keeps the empty fields that runs of spaces produce.

Reading two similar problem statements as the same problem is the actual hazard.
The word "reverse" appears in both and means different things.

## The identity that links them

Reversing the whole string reverses both the word order **and** the characters
inside each word. So doing it once and then undoing one of the two effects gives
you the other problem:

```
"abc def"
  reverse the whole string   ->  "fed cba"
  reverse the word order     ->  "cba fed"       = each word reversed
```

Which is the same statement as:

```
reverseWordOrder(s)  ==  reverseEachWord(reverse(s))
```

Verified over 200,000 generated strings with **zero mismatches**. This is exactly
the reverse-twice trick the sibling container measured as its fastest C++
approach, seen from the other end — and below, it turns out to be the fastest
**Python** implementation of *this* problem.

## Reversing in place is 4.8x faster

The obvious implementation splits into words, reverses each, and rejoins. Two
better ones exist: scan the string and append each word backwards as you find it,
or — if you may modify the buffer — reverse each word where it already sits, with
no allocation at all.

Microseconds per run:

| Input | Split and rejoin | Scan and build | **Reverse in place** |
|---|---|---|---|
| 20 words of 5 characters | 1.31 | 0.62 | **0.20** |
| 2,000 words of 5 | 80.25 | 63.13 | **15.43** |
| 20,000 words of 5 | 720.43 | 578.24 | **149.98** |
| 2,000 words of 60 | 745.83 | 522.19 | **89.13** |
| One word of 100,000 | 378.59 | 412.67 | **57.50** |

**4.8x** at 20,000 words and **6.6x** on a single long word. The in-place figures
even include copying the input, since the function takes it by value — on a buffer
you already own, it allocates nothing whatever.

## `std::reverse` beats a hand-written swap, but only on long words

Reversing a range is four lines with two pointers, and the standard algorithm is
faster — sometimes. Holding the total input at about 120,000 characters and
varying only the word length:

| Word length | Words | `std::reverse` | Two-pointer swap | Ratio |
|---|---|---|---|---|
| 2 | 40,000 | 213.31 | **191.62** | **0.90x** |
| 4 | 24,000 | 171.33 | 176.11 | 1.03x |
| 8 | 13,333 | 150.35 | 164.38 | 1.09x |
| 16 | 7,058 | **108.02** | 149.68 | 1.39x |
| 32 | 3,636 | **89.79** | 139.67 | 1.56x |
| 64 | 1,846 | **81.96** | 151.13 | 1.84x |
| 2,048 | 58 | **77.64** | 147.30 | 1.90x |
| 120,000 | 1 | **83.82** | 166.40 | 1.99x |

Both perform exactly the same number of swaps. The difference is that a long run
gives the vectoriser something to work with, and a two-character word does not —
at length 2 the hand-written loop is actually **10% faster**, because the setup
cost of the library call is not amortised.

The crossover is around length 4, and the plateau is 2x. English words average
about five characters, so on natural-language text this is a wash at 1.09x; on
base64, hashes, identifiers or DNA it is the full 2x.

## Python: the identity wins

| Input | `join` + slice | `join` + `map` | Manual scan | Character loop | **Reverse-twice identity** |
|---|---|---|---|---|---|
| 2,000 words of 5 | 417.1 | 522.3 | 2,222.8 | 2,593.6 | **152.5** |
| 20,000 words of 5 | 3,113.3 | 3,350.6 | 15,336.7 | 17,401.7 | **1,200.7** |
| 200 words of 500 | 218.6 | **208.6** | 9,855.1 | 16,285.9 | 238.9 |

`" ".join(reversed(s[::-1].split(" ")))` is **2.6x** faster than the idiomatic
`" ".join(w[::-1] for w in s.split(" "))` on many short words, and the reason is
the same rule this topic has been repeating: it does **three** C-level operations
on the whole string — one slice-reverse, one split, one join — instead of one
small slice-reverse per word plus the generator machinery around it.

On few long words the advantage disappears (238.9 against 218.6), because then
there are few per-word calls to amortise and the work is in the characters
themselves.

Both hand-written loops are 5x to 40x slower, as usual.

## What to write

If you own the buffer, reverse each word in place — it is the fastest and
allocates nothing. If you must return a new string, scan and append. In Python,
either the idiomatic `join` or the reverse-twice identity, which is faster when
the words are short and equal when they are long. In every language, split on the
single space character and not on whitespace, or the spacing the problem asks you
to preserve will be gone.

<!-- @intuition -->
The trap in this problem is not in the algorithm, it is in having seen a problem that looks exactly like it. Its sibling reverses the order of words and normalises the spacing; this one reverses characters inside words and preserves the spacing exactly, so the two differ in both halves and the split idiom that is correct in one is the bug in the other. Once that is settled the work is a scan that finds runs of non-space characters and reverses each, and the only real decision is whether you may write into the buffer you were given — because reversing in place removes every allocation and is several times faster than building an answer. The pleasing part is the identity underneath. Reversing the whole string flips both the word order and the letters within each word, so undoing either one leaves the other, which means each of these two problems is the other one composed with a single full reversal. That is not just a nice observation: in Python it is the fastest implementation, because it turns one C call per word into three C calls total.

<!-- @approach -->
### Split, Reverse Each, Rejoin

<!-- @idea -->
Break the string on single spaces, reverse each field, and join the fields back with single spaces.

<!-- @steps -->
1. Split the input on the space character, keeping empty fields.
2. Reverse the characters of each field.
3. Join the fields back together with a single space between each.
4. Return the result.

<!-- @complexity -->
- time: O(n) — one pass to split, one to reverse, one to join
- space: O(n) for the list of fields plus O(n) for the output
- note: The direct reading, and the one where the whitespace decision has to be made explicitly. Splitting on runs of whitespace instead of the single space character silently collapses the spacing the problem asks you to preserve — measured, that changes the answer on **81.5%** of realistically spaced inputs. In C++ it measured 720.43 microseconds at 20,000 words against 149.98 for reversing in place.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

string reverseWords(const string& s) {
    vector<string> parts;
    string cur;
    for (char c : s) {
        if (c == ' ') { parts.push_back(cur); cur.clear(); }
        else cur += c;
    }
    parts.push_back(cur);

    string out;
    for (size_t i = 0; i < parts.size(); i++) {
        if (i) out += ' ';
        out.append(parts[i].rbegin(), parts[i].rend());
    }
    return out;
}
```

<!-- @annotations -->
- 10: Pushing on every space, including consecutive ones, is what keeps the empty fields — and the empty fields are what reproduce runs of spaces on the way back out.
- 12: The final push after the loop, for the field that has no space after it. Omitting it drops the last word.
- 18: `append(rbegin, rend)` copies the field backwards in one call rather than a loop.

<!-- @code java -->
```java
static String reverseWords(String s) {
    String[] parts = s.split(" ", -1);
    StringBuilder out = new StringBuilder(s.length());
    for (int i = 0; i < parts.length; i++) {
        if (i > 0) out.append(' ');
        out.append(new StringBuilder(parts[i]).reverse());
    }
    return out.toString();
}
```

<!-- @annotations -->
- 2: The `-1` limit is essential. `s.split(" ")` discards trailing empty fields, so trailing spaces would vanish — exactly the whitespace the problem requires you to keep.

<!-- @code python -->
```python
def reverse_words(s):
    return " ".join(w[::-1] for w in s.split(" "))


# split(" ") and NOT split(). The argumentless version collapses runs
# of spaces and trims the ends, which is right for the sibling problem
# and wrong here -- measured, the two differ on 81.5% of realistically
# spaced inputs.
```

<!-- @annotations -->
- 2: `s.split(" ")` keeps the empty fields between consecutive spaces, and reversing an empty field leaves it empty, so the run is rebuilt exactly by the join.

<!-- @approach -->
### Scan and Build the Output

<!-- @idea -->
Walk the string once, copying spaces straight through and appending each run of non-space characters backwards.

<!-- @steps -->
1. Reserve an output buffer the length of the input.
2. Walk the input from the start.
3. Copy a space directly and advance.
4. Otherwise find the end of the run of non-space characters.
5. Append that run backwards.
6. Continue from the end of the run.

<!-- @complexity -->
- time: O(n) — each character read once and written once
- space: O(n) for the output, with no intermediate list of words
- note: The version to write when the result must be a new string. It measured 578.24 microseconds at 20,000 words against 720.43 for splitting and rejoining, the difference being the vector of fields that never gets built. It is still behind reversing in place at 149.98, because it writes every character to a second buffer.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

string reverseWords(const string& s) {
    string out;
    out.reserve(s.size());
    size_t i = 0, n = s.size();
    while (i < n) {
        if (s[i] == ' ') { out += ' '; i++; continue; }
        size_t j = i;
        while (j < n && s[j] != ' ') j++;
        for (size_t k = j; k > i; k--) out += s[k - 1];
        i = j;
    }
    return out;
}
```

<!-- @annotations -->
- 9: Spaces are copied one at a time rather than skipped, which is the whole difference from the sibling problem — there they were separators to normalise, here they are content.
- 12: `k > i` with `s[k - 1]`, so the loop covers the range without `k` ever going negative — a `size_t` cannot.
- 6: Reserving up front is free here because the output is exactly the input's length; nothing is added or removed.

<!-- @code java -->
```java
static String reverseWords(String s) {
    StringBuilder out = new StringBuilder(s.length());
    int i = 0, n = s.length();
    while (i < n) {
        if (s.charAt(i) == ' ') { out.append(' '); i++; continue; }
        int j = i;
        while (j < n && s.charAt(j) != ' ') j++;
        for (int k = j - 1; k >= i; k--) out.append(s.charAt(k));
        i = j;
    }
    return out.toString();
}
```

<!-- @annotations -->
- 8: A plain `int` index here, so counting down to `i` is safe — the C++ version has to avoid an unsigned underflow that Java cannot hit.

<!-- @code python -->
```python
def reverse_words(s):
    out = []
    i, n = 0, len(s)
    while i < n:
        if s[i] == " ":
            out.append(" ")
            i += 1
            continue
        j = i
        while j < n and s[j] != " ":
            j += 1
        out.append(s[i:j][::-1])
        i = j
    return "".join(out)


# 2,222.8us at 2,000 words against 417.1 for the join idiom -- 5.3x
# slower, because the scanning loop is interpreted and split/join are
# not. Included for symmetry with the C++ version, not as advice.
```

<!-- @annotations -->
- 12: Slicing then reversing the slice keeps the per-word work in C. Appending characters individually instead measured 2,593.6 microseconds against 2,222.8.

<!-- @approach -->
### Optimal - Reverse Each Word In Place

<!-- @idea -->
Find each run of non-space characters and reverse it where it already sits, with no output buffer at all.

<!-- @steps -->
1. Walk the buffer from the start.
2. Skip over a space and continue.
3. Otherwise find the end of the run of non-space characters.
4. Reverse the characters between those two positions in place.
5. Continue from the end of the run.

<!-- @complexity -->
- time: O(n) — each character is swapped at most once
- space: O(1) — nothing is allocated
- note: The one to write when you may modify the buffer. Measured 149.98 microseconds at 20,000 words against 720.43 for splitting and rejoining — **4.8x** — and 57.50 against 378.59 on a single 100,000-character word, **6.6x**. Those figures even include copying the input, since the function takes it by value; given a buffer you already own it allocates nothing at all. Whitespace is preserved automatically, because no space is ever moved.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <string>
using namespace std;

string reverseWords(string s) {
    size_t i = 0, n = s.size();
    while (i < n) {
        if (s[i] == ' ') { i++; continue; }
        size_t j = i;
        while (j < n && s[j] != ' ') j++;
        reverse(s.begin() + i, s.begin() + j);
        i = j;
    }
    return s;
}
```

<!-- @annotations -->
- 11: `std::reverse` rather than a hand-written swap loop. On words of 16 characters or more it is 1.4x to 2.0x faster because the range vectorises; at two characters the hand-written loop is 10% faster, since the call is not amortised.
- 5: Taking the string **by value** makes the copy explicit and the mutation safe. A caller with a buffer to spare can take `string&` instead and allocate nothing.
- 8: Spaces are stepped over, never written, which is why the spacing survives untouched.

<!-- @code java -->
```java
static String reverseWords(String s) {
    char[] a = s.toCharArray();
    int i = 0, n = a.length;
    while (i < n) {
        if (a[i] == ' ') { i++; continue; }
        int j = i;
        while (j < n && a[j] != ' ') j++;
        for (int l = i, r = j - 1; l < r; l++, r--) {
            char t = a[l]; a[l] = a[r]; a[r] = t;
        }
        i = j;
    }
    return new String(a);
}
```

<!-- @annotations -->
- 2: Java Strings are immutable, so "in place" means in a `char[]` copy. That is one allocation for the whole call rather than one per word.

<!-- @code python -->
```python
def reverse_words(s):
    a = list(s)
    i, n = 0, len(a)
    while i < n:
        if a[i] == " ":
            i += 1
            continue
        j = i
        while j < n and a[j] != " ":
            j += 1
        a[i:j] = a[i:j][::-1]
        i = j
    return "".join(a)


# Python strings are immutable too, so this converts to a list first --
# which costs more than it saves. The join idiom is the right answer
# here; this exists to mirror the C++ version.
```

<!-- @annotations -->
- 11: Slice assignment reverses the range in the list without a per-character loop, but the `list(s)` and `"".join(a)` around it already cost more than the idiomatic one-liner does in total.

<!-- @approach -->
### Reverse the Whole String, Then the Word Order

<!-- @idea -->
A full reversal flips both the word order and the letters inside each word, so undoing the word order leaves each word reversed.

<!-- @steps -->
1. Reverse the entire string.
2. Split the result on the space character.
3. Reverse the order of the resulting fields.
4. Join them back with single spaces.

<!-- @complexity -->
- time: O(n) — three linear passes
- space: O(n) for the reversed copy and the fields
- note: The identity `reverseWordOrder(s) == reverseEachWord(reverse(s))` read in the other direction, verified over 200,000 generated strings with zero mismatches. In C++ it is a curiosity; in Python it is the **fastest** implementation on many short words — 152.5 microseconds at 2,000 words against 417.1 for the idiomatic `join`, a 2.6x gain — because it performs three C-level operations on the whole string instead of one small slice-reverse per word. On few long words the advantage disappears, at 238.9 against 218.6.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <string>
#include <vector>
using namespace std;

string reverseWords(string s) {
    reverse(s.begin(), s.end());
    vector<string> parts;
    string cur;
    for (char c : s) {
        if (c == ' ') { parts.push_back(cur); cur.clear(); }
        else cur += c;
    }
    parts.push_back(cur);

    string out;
    out.reserve(s.size());
    for (size_t i = parts.size(); i > 0; i--) {
        if (i != parts.size()) out += ' ';
        out += parts[i - 1];
    }
    return out;
}
```

<!-- @annotations -->
- 7: One reversal of the whole buffer flips the word order and each word's letters at once. Everything after this line undoes the first of those two effects.
- 18: Walking the fields backwards restores the original word order, leaving only the per-word reversal in place.

<!-- @code java -->
```java
static String reverseWords(String s) {
    String r = new StringBuilder(s).reverse().toString();
    String[] parts = r.split(" ", -1);
    StringBuilder out = new StringBuilder(s.length());
    for (int i = parts.length - 1; i >= 0; i--) {
        if (i != parts.length - 1) out.append(' ');
        out.append(parts[i]);
    }
    return out.toString();
}
```

<!-- @annotations -->
- 3: The `-1` limit again — without it a string ending in a space loses its trailing empty field, and after the reversal that field was a *leading* space in the original.

<!-- @code python -->
```python
def reverse_words(s):
    return " ".join(reversed(s[::-1].split(" ")))


# The fastest Python version on many short words: 152.5us at 2,000
# words against 417.1 for " ".join(w[::-1] for w in s.split(" ")) --
# 2.6x. Three C-level operations on the whole string instead of one
# per word. On 200 words of 500 characters the edge is gone (238.9
# against 218.6), since there is little per-word overhead left to save.
```

<!-- @annotations -->
- 2: Reads as three whole-string operations — reverse, split, reverse the order — with no Python-level loop and no generator expression, which is exactly why it wins.

<!-- @example -->

<!-- @input -->
s = "Let's take LeetCode contest"

<!-- @output -->
"s'teL ekat edoCteeL tsetnoc"

<!-- @why -->
The standard case, with the apostrophe showing that "word" means a run of non-space characters rather than anything linguistic.

<!-- @walkthrough -->
1. The scan finds the first run, `Let's`, ending at the space.
2. Reversed it becomes `s'teL` — the apostrophe is just another character in the run.
3. The space is copied through unchanged, or stepped over if reversing in place.
4. `take` becomes `ekat`, `LeetCode` becomes `edoCteeL`, `contest` becomes `tsetnoc`.
5. The words stay in their original order — only their contents changed.
6. The sibling problem would produce `"contest LeetCode take Let's"` from the same input, reversing the order and leaving the words intact.
7. Applying both operations, in either order, gives the full reversal of the string.

<!-- @example -->

<!-- @input -->
s = "  hello   world  "

<!-- @output -->
"  olleh   dlrow  "

<!-- @why -->
The whitespace case, and the one where the correct split idiom is the opposite of the sibling problem's.

<!-- @walkthrough -->
1. Two leading spaces, three between the words, two trailing — all must survive.
2. `s.split(" ")` yields `['', '', 'hello', '', '', 'world', '', '']` — eight fields, five empty.
3. Reversing each field leaves the empty ones empty and turns `hello` into `olleh`.
4. Joining with single spaces rebuilds every run exactly, because n empty fields between two words reproduce n+1 spaces.
5. `s.split()` would yield `['hello', 'world']` and produce `"olleh dlrow"` — the spacing gone.
6. Over 200,000 generated inputs with realistic spacing, the two differ on **163,060 — 81.5%**.
7. In the sibling problem the argumentless `split()` is the correct one, and using `split(" ")` there was the bug. Same two idioms, opposite verdicts.

<!-- @example -->

<!-- @input -->
The reverse-twice identity, checked over 200,000 generated strings

<!-- @output -->
Zero mismatches — and in Python, the fastest implementation

<!-- @why -->
Connects the two sibling problems formally, and turns the connection into the fastest code rather than leaving it as an observation.

<!-- @walkthrough -->
1. Reversing an entire string flips two things at once: the order of the words and the letters within each word.
2. So undoing one of them leaves exactly the other.
3. Reversing the whole string and then restoring the word order gives each word reversed — this problem.
4. Reversing the whole string and then re-reversing each word gives the word order flipped — the sibling problem.
5. The identity `reverseWordOrder(s) == reverseEachWord(reverse(s))` held over 200,000 generated strings with zero mismatches.
6. In Python, `" ".join(reversed(s[::-1].split(" ")))` measured **152.5 microseconds** at 2,000 five-letter words against 417.1 for the idiomatic per-word slice — **2.6x**.
7. The reason is that it performs three C-level operations on the whole string, where the idiom performs one small operation per word plus generator overhead.
8. At 200 words of 500 characters the advantage vanishes, at 238.9 against 218.6, because there is little per-word overhead left to eliminate.

<!-- @example -->

<!-- @input -->
120,000 characters split into words of length 2 up to a single word of 120,000

<!-- @output -->
The hand-written swap wins at length 2 by 10%, and loses by 2.0x at length 120,000

<!-- @why -->
Shows that "use the standard algorithm" has a crossover, and locates it.

<!-- @walkthrough -->
1. Both implementations perform exactly the same number of character swaps, since the total input length is held constant.
2. At words of 2 characters: `std::reverse` 213.31 microseconds, the two-pointer loop **191.62** — the loop is 10% faster.
3. At 4 characters they are level, at 171.33 and 176.11.
4. At 16 characters the library pulls ahead, 108.02 against 149.68 — 1.39x.
5. At 64 characters it is 81.96 against 151.13 — 1.84x.
6. At one word of 120,000 characters it is 83.82 against 166.40 — 1.99x.
7. A long run gives the vectoriser whole registers to work with; a two-character word gives it nothing, and the library call's setup is not amortised.
8. English words average about five characters, so on natural text the choice is worth 1.09x — on base64, hashes or DNA it is the full 2x.

<!-- @visualization custom -->

<!-- @description -->
Put the two sibling problems on one canvas from the start, because the contrast is the content. Draw the same input strip twice — `"  hello   world  "` with the space runs shaded — and animate each transformation beneath its copy. On the left, the sibling problem: the word blocks detach and swap places while the shaded runs collapse to single cells and the end runs vanish entirely. On the right, this problem: the word blocks stay pinned in position while their letters flip inside them, and every shaded run keeps its exact width. Label the split idioms under each — `split()` on the left, `split(" ")` on the right — and put the measured 81.5% between them, so the reader sees that the correct call swaps sides. Then the identity, drawn as a commuting square. Top-left is the input; going right applies a full string reversal; going down applies "restore the word order". Show that the two paths from the input meet at the same result, with the full reversal in the corner visibly containing both effects at once — the words in the wrong order *and* their letters flipped. That single frame is why each problem is the other one composed with a reversal. Next, the in-place panel: the same buffer with a cursor finding each non-space run and swapping its ends inward, with an allocation counter beside it reading zero while the split-and-rejoin version's counter climbs one per word. Timings 149.98us against 720.43 at 20,000 words. Close on the crossover curve, which needs to be a real plot: word length on a log x-axis from 2 to 120,000 with total input fixed, two lines for `std::reverse` and the hand-written swap, crossing just past length 4 and separating to a stable 2x. Mark the average English word length at 5 with a vertical rule labelled 1.09x here, and mark length 64 labelled 1.84x, so the reader can see which regime their data is in.

<!-- @sampleInput -->
```json
{"primary":{"s":"Let's take LeetCode contest","answer":"s'teL ekat edoCteeL tsetnoc","note":"words stay in place; only their characters reverse"},"smallCases":[{"s":"Let's take LeetCode contest","answer":"s'teL ekat edoCteeL tsetnoc"},{"s":"the sky is blue","answer":"eht yks si eulb"},{"s":"  hello   world  ","answer":"  olleh   dlrow  "},{"s":"a  b","answer":"a  b"},{"s":"","answer":""},{"s":"   ","answer":"   "},{"s":"one","answer":"eno"}],"mirrorOfSibling":{"table":[{"aspect":"what is reversed","siblingProblem":"the ORDER of the words","thisProblem":"the CHARACTERS inside each word"},{"aspect":"whitespace","siblingProblem":"collapsed to single spaces, ends trimmed","thisProblem":"preserved exactly"},{"aspect":"correct Python split","siblingProblem":"s.split()","thisProblem":"s.split(\" \")"}],"measured":{"generatedInputs":200000,"differOnWhitespaceHandling":163060,"share":"81.5%"},"siblingMeasured":"80.7% — the same comparison, with the opposite verdict on which idiom is correct","hazard":"reading two similar problem statements as the same problem; the word 'reverse' appears in both and means different things"},"identity":{"statement":"reverseWordOrder(s) == reverseEachWord(reverse(s))","why":"reversing the whole string flips both the word order and the letters within each word, so undoing either leaves the other","worked":{"input":"abc def","afterFullReversal":"fed cba","afterRestoringWordOrder":"cba fed","equals":"each word reversed"},"verification":{"generatedStrings":200000,"mismatches":0},"connection":"this is the reverse-twice trick the sibling container measured as its fastest C++ approach, seen from the other end"},"benchCpp":{"unit":"microseconds per run, Apple M2, clang -O2","rows":[{"input":"20 words of 5 characters","splitRejoin":1.31,"scanBuild":0.62,"inPlace":0.20},{"input":"2,000 words of 5","splitRejoin":80.25,"scanBuild":63.13,"inPlace":15.43},{"input":"20,000 words of 5","splitRejoin":720.43,"scanBuild":578.24,"inPlace":149.98},{"input":"2,000 words of 60","splitRejoin":745.83,"scanBuild":522.19,"inPlace":89.13},{"input":"one word of 100,000","splitRejoin":378.59,"scanBuild":412.67,"inPlace":57.50}],"inPlaceGain":"4.8x at 20,000 words, 6.6x on a single long word","caveat":"the in-place figures include copying the input, since the function takes it by value; on a buffer you already own it allocates nothing"},"stdReverseCrossover":{"setup":"total input held at about 120,000 characters, only the word length varied","note":"both implementations perform exactly the same number of swaps","rows":[{"wordLength":2,"words":40000,"stdReverse":213.31,"twoPointerSwap":191.62,"ratio":"0.90x"},{"wordLength":4,"words":24000,"stdReverse":171.33,"twoPointerSwap":176.11,"ratio":"1.03x"},{"wordLength":8,"words":13333,"stdReverse":150.35,"twoPointerSwap":164.38,"ratio":"1.09x"},{"wordLength":16,"words":7058,"stdReverse":108.02,"twoPointerSwap":149.68,"ratio":"1.39x"},{"wordLength":32,"words":3636,"stdReverse":89.79,"twoPointerSwap":139.67,"ratio":"1.56x"},{"wordLength":64,"words":1846,"stdReverse":81.96,"twoPointerSwap":151.13,"ratio":"1.84x"},{"wordLength":2048,"words":58,"stdReverse":77.64,"twoPointerSwap":147.30,"ratio":"1.90x"},{"wordLength":120000,"words":1,"stdReverse":83.82,"twoPointerSwap":166.40,"ratio":"1.99x"}],"crossover":"around length 4; plateau 2x","why":"a long run gives the vectoriser whole registers; a two-character word gives it nothing and the call setup is not amortised","practicalReading":"English words average about five characters, so natural text is a wash at 1.09x; base64, hashes, identifiers and DNA get the full 2x"},"benchPython":{"unit":"microseconds per run, CPython 3.13.4","rows":[{"input":"2,000 words of 5","joinSlice":417.1,"joinMap":522.3,"manualScan":2222.8,"characterLoop":2593.6,"reverseTwiceIdentity":152.5},{"input":"20,000 words of 5","joinSlice":3113.3,"joinMap":3350.6,"manualScan":15336.7,"characterLoop":17401.7,"reverseTwiceIdentity":1200.7},{"input":"200 words of 500","joinSlice":218.6,"joinMap":208.6,"manualScan":9855.1,"characterLoop":16285.9,"reverseTwiceIdentity":238.9}],"winner":"\" \".join(reversed(s[::-1].split(\" \"))) — 2.6x on many short words","why":"three C-level operations on the whole string instead of one small slice-reverse per word plus generator overhead","whenItStopsWinning":"few long words — 238.9 against 218.6 at 200 words of 500, since there is little per-word overhead left to save","handWrittenLoops":"5x to 40x slower, as everywhere else in this topic"},"assertions":["the output has the same length as the input","every space in the input is a space at the same index in the output","each maximal run of non-space characters is reversed","the word order is unchanged","applying the operation twice returns the original string"],"recommendation":"reverse each word in place if you own the buffer; otherwise scan and append. In Python use the join idiom or the reverse-twice identity. Split on the single space character, never on whitespace.","lesson":"two problems whose statements differ by one word differ in both of their halves — and the identity relating them is not just an observation, it is the fastest implementation in one of the two languages"}
```

<!-- @highlights -->
- Both sibling problems share one canvas, with the same input strip drawn twice and its space runs shaded.
- On the left the word blocks detach and swap places while the shaded runs collapse and the end runs vanish.
- On the right the word blocks stay pinned while their letters flip inside them, and every run keeps its exact width.
- The split idioms are labelled under each — `split()` on the left, `split(" ")` on the right — with the measured 81.5% between them.
- The reader sees the correct call swap sides between two nearly identical problems.
- The identity is drawn as a commuting square: input at top-left, a full reversal going right, restoring the word order going down.
- Both paths from the input meet at the same result.
- The full reversal in the corner visibly contains both effects at once — words in the wrong order and their letters flipped.
- That single frame is why each problem is the other composed with a reversal.
- The in-place panel shows a cursor finding each non-space run and swapping its ends inward.
- An allocation counter beside it reads zero while the split-and-rejoin counter climbs one per word.
- The timings read 149.98us against 720.43 at 20,000 words.
- The close is a real plot: word length on a log axis from 2 to 120,000, total input fixed.
- Two lines for `std::reverse` and the hand-written swap cross just past length 4 and separate to a stable 2x.
- A vertical rule at length 5 is labelled 1.09x here, marking average English word length.
- A second mark at length 64 is labelled 1.84x, so the reader can place their own data.

<!-- @edgeCases -->
- The empty string — returns empty; every version falls through its loop.
- A string of only spaces — returned unchanged, and the case where `split()` would return nothing at all.
- A single word with no spaces — reversed whole, and the input where the in-place version does one long reversal.
- Leading or trailing spaces — preserved exactly, unlike the sibling problem which trims them.
- Runs of two or more spaces between words — preserved exactly, which requires splitting on the single space character.
- A one-character word — reversing it is a no-op, and the range passed to `reverse` is empty or single.
- Two-character words throughout — the only regime where a hand-written swap loop beats `std::reverse`, by 10%.
- A very long single word — the in-place version's best case at 6.6x, and where `std::reverse` is 2.0x ahead of a manual loop.
- Punctuation inside a word, like `"Let's"` — a word is a run of non-space characters, so the apostrophe reverses with everything else.
- Trailing spaces in Java with `split(" ")` — silently dropped without a `-1` limit, losing the whitespace the problem requires.
- Applying the operation twice — must return the original string exactly, which is the cheapest property test available.

<!-- @pitfalls -->
- Splitting on whitespace instead of the single space character. That collapses the runs this problem must preserve, changing the answer on **81.5%** of realistically spaced inputs.
- Assuming this is the same problem as reversing the word order. They differ in both halves — what gets reversed and what happens to the spacing — and the correct split idiom is opposite in each.
- Omitting the `-1` limit in Java's `split(" ")`. Trailing empty fields are discarded by default, so trailing spaces vanish.
- Forgetting the final `push_back` after the loop in the manual split. The last word has no space after it and is dropped.
- Building an output buffer when the input is yours to modify. Reversing in place measured 4.8x faster and allocates nothing.
- Reaching for a hand-written swap loop on principle. `std::reverse` is 1.4x to 2.0x faster on words of 16 characters or more, and only 10% slower at two characters.
- Assuming the library call always wins. At word length 2 the hand-written loop is faster, because the setup is not amortised over four swaps.
- Writing the scan loop in Python. Measured 2,222.8 microseconds against 417.1 for the join idiom, and 5.3x is the *good* hand-written version.
- Counting down with an unsigned index in C++. `for (size_t k = j - 1; k >= i; k--)` never terminates when `i` is 0; use `k > i` with `s[k - 1]`.
- Normalising the output "for tidiness". The spacing is part of the specification here, and a correct answer looks untidy on purpose.

<!-- @doubt -->
### How is this different from reversing the words in a string?

<!-- @answer -->
In both halves, which is what makes the pair worth studying together. That problem reverses the **order** of the words and leaves each word intact; this one reverses the **characters inside** each word and leaves the order intact. That problem **normalises** whitespace — runs collapsed to one space, ends trimmed; this one **preserves** it exactly. The consequence in code is that the correct Python idiom swaps: `s.split()` is right there and wrong here, while `s.split(" ")` is right here and wrong there. Measured on realistically spaced input, those two idioms differ on 80.7% of cases in the sibling problem and **81.5%** here — the same comparison, with opposite verdicts. The real hazard is reading the second statement as if it were the first.

<!-- @doubt -->
### Why `split(" ")` and not `split()`?

<!-- @answer -->
Because the empty fields are what encode the spacing. `"  hello   world  ".split(" ")` gives `['', '', 'hello', '', '', 'world', '', '']` — eight fields, five of them empty — and joining those back with single spaces reproduces every run exactly, since n empty fields between two words rebuild n+1 spaces. Reversing an empty field leaves it empty, so the whole transformation is whitespace-preserving for free. The argumentless `split()` gives `['hello', 'world']`, discarding the information you need. In Java the equivalent trap is the default limit: `s.split(" ")` drops trailing empty fields, so `s.split(" ", -1)` is required or trailing spaces disappear.

<!-- @doubt -->
### What is the identity connecting the two problems?

<!-- @answer -->
Reversing an entire string does two things at once: it puts the words in the opposite order **and** reverses the letters inside each one. So undoing either effect leaves the other. Formally, `reverseWordOrder(s) == reverseEachWord(reverse(s))`, verified over 200,000 generated strings with zero mismatches. Concretely: `"abc def"` reversed is `"fed cba"`; restore the word order and you get `"cba fed"`, which is the original words each reversed. It is the same trick the sibling container measured as its fastest C++ approach — reverse the whole buffer, then reverse each word — read from the other end. And it is not only an observation: in Python, `" ".join(reversed(s[::-1].split(" ")))` is the **fastest** implementation of this problem.

<!-- @doubt -->
### Should I reverse in place or build a new string?

<!-- @answer -->
In place, whenever you are allowed to. Measured at 20,000 five-letter words: 149.98 microseconds in place against 578.24 for scanning and appending and 720.43 for splitting and rejoining — **4.8x** over the obvious version. On a single 100,000-character word it is 57.50 against 378.59, or 6.6x. And those in-place numbers *include* copying the input, because the function takes the string by value; hand it a buffer you already own and it allocates nothing at all, where the alternatives allocate an output of the input's full length plus, in the split version, one string per word. The only reason not to is that the caller may need the original, which is a decision about the interface rather than the algorithm.

<!-- @doubt -->
### Is `std::reverse` faster than writing the swap loop myself?

<!-- @answer -->
On long words, and not on short ones — there is a real crossover. Holding the total input at about 120,000 characters so both do exactly the same number of swaps, and varying only the word length: at 2 characters the hand-written loop wins, 191.62 microseconds against 213.31, because the library call's setup is not amortised over four swaps. They level at length 4. From 16 upward `std::reverse` pulls ahead — 108.02 against 149.68 — and it plateaus around **2.0x** for long runs, because a long range gives the vectoriser whole registers to work with. The practical reading: English words average about five characters, so on natural-language text this is worth 1.09x and not worth thinking about; on base64, hashes, identifiers or DNA sequences it is the full 2x.

<!-- @doubt -->
### What is the fastest Python version?

<!-- @answer -->
`" ".join(reversed(s[::-1].split(" ")))` — the reverse-twice identity — at **152.5 microseconds** against 417.1 for the idiomatic `" ".join(w[::-1] for w in s.split(" "))` on 2,000 five-letter words, a 2.6x gain. The reason is the rule that has held across this entire topic: it performs three C-level operations on the whole string — one slice-reverse, one split, one order-reverse — where the idiom performs one small slice-reverse per word plus the generator machinery around each. The advantage is entirely about per-word overhead, so it disappears when the words are long: at 200 words of 500 characters the two measured 238.9 and 218.6, and the idiom is marginally ahead. Both hand-written scanning loops are 5x to 40x slower and are not worth writing in Python at all.

<!-- @doubt -->
### How should I test this?

<!-- @answer -->
With properties rather than expected strings, and one of them is unusually cheap. **Applying the operation twice must return the original input exactly** — reversing each word and then reversing each word again is the identity — so a single round-trip check over random input catches almost every mistake, including dropped last words, lost trailing spaces and collapsed runs. Add three more: the output has the same length as the input, every space in the input is a space at the same index in the output, and the word order is unchanged. That last pair is what separates this problem from its sibling, and testing them explicitly is how you notice if you have written the wrong one. All four implementations here were cross-checked against each other over 20,000 random spacings with zero mismatches.
