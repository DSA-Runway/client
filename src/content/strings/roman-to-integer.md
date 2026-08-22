---
id: roman-to-integer
topic: Strings
title: Roman to Integer
difficulty: Medium
status: ready
prerequisites:
  - for-loop
  - if-else-statements
  - data-types
  - largest-element
  - maximum-nesting-depth-of-the-parentheses
  - time-and-space-complexity-basics
relatedIds:
  - string-to-integer-atoi
  - maximum-nesting-depth-of-the-parentheses
  - largest-element
  - check-if-two-strings-are-anagram-of-each-other
  - count-number-of-substrings
---

<!-- @summary -->
Convert a Roman numeral to an integer with one rule — subtract a symbol smaller than the one after it — verified against all 3,999 canonical numerals with zero mismatches; where that rule is an **evaluator rather than a parser**, returning a number for **96.25%** of symbol strings that are not Roman numerals at all; and where the textbook left-to-right version and the right-to-left one that needs no lookahead agree on every valid numeral and **disagree on 50.34%** of invalid ones.

<!-- @theory -->
## The problem

Roman numerals are written from largest to smallest and added up — except for six
cases where a smaller symbol placed **before** a larger one is subtracted.

| Symbol | I | V | X | L | C | D | M |
|---|---|---|---|---|---|---|---|
| Value | 1 | 5 | 10 | 50 | 100 | 500 | 1000 |

```
"III"              ->  3
"LVIII"            ->  58      L + V + III
"MCMXCIV"          ->  1994    M + CM + XC + IV
"MMMDCCCLXXXVIII"  ->  3888    the longest numeral, 15 characters
```

The six subtractive pairs are `IV`, `IX`, `XL`, `XC`, `CD` and `CM`. The stated
range is 1 to 3999, and the input is guaranteed to be a valid numeral.

## One rule covers all six pairs

You do not need to enumerate the pairs. **A symbol is subtracted exactly when the
symbol after it is larger.**

```
M  C  M  X  C  I  V
1000  100 < 1000  10 < 100   1 < 5
 +     -    +      -   +     -   +
1000  -100 +1000 -10 +100   -1  +5   =  1994
```

Verified rather than assumed: applying that rule to every canonical numeral from
1 to 3999 reproduces the value **every time — zero mismatches** across all
implementations below.

The reason it works is that a valid numeral never places a smaller symbol before
a larger one except in those six cases, so "smaller than the next" and "one of
the six pairs" describe the same positions. The rule is shorter and it is what
the pairs are *for*.

## The algorithm is an evaluator, not a parser

This is the part worth knowing about the standard solution: it never rejects
anything. Feed it any string of Roman symbols and it returns a number.

Over every string of length 1 to 5 drawn from `IVXLCDM`:

| | Strings |
|---|---|
| Total | 19,607 |
| The algorithm returns a number for | **19,607 (100%)** |
| Actually canonical Roman numerals | **735 (3.75%)** |
| **Accepted but not Roman numerals** | **18,872 (96.25%)** |

Some of what it accepts looks plausible and is not:

| Input | Returned | The canonical numeral for that value |
|---|---|---|
| `"IL"` | 49 | `XLIX` |
| `"IC"` | 99 | `XCIX` |
| `"IM"` | 999 | `CMXCIX` |
| `"VV"` | 10 | `X` |
| `"VX"` | 5 | `V` |

`IL` is not a Roman numeral — subtraction is only allowed from the next two
denominations up — but the rule happily evaluates it. Many strings also collapse
onto the same value: **41 distinct strings of length four or less evaluate to
1000**.

None of this is a bug against the stated problem, which guarantees a valid
numeral. It matters the moment the input comes from a user or a file, and the
check is one line: convert the value back to a numeral and compare. That
round-trip identifies exactly the 735 canonical strings and nothing else.

## Right to left removes the lookahead

Scanning backwards replaces "peek at the next symbol" with "compare against the
largest seen so far":

```
start from the right, carrying the biggest value seen
if this symbol is smaller than that       ->  subtract it
otherwise                                 ->  add it, and it becomes the biggest
```

It is shorter, it needs no bounds check on the lookahead, and it does **one table
lookup per character instead of two** — the left-to-right version looks up both
the current symbol and the next one on every iteration.

## The two versions disagree on half of all invalid input

Here is the finding worth carrying away, because it is about testing rather than
about Roman numerals.

The two scans agree on **every one of the 3,999 canonical numerals**. Over all
19,607 symbol strings of length 1 to 5 they **disagree on 9,870 — 50.34%**:

| Input | Left to right | Right to left |
|---|---|---|
| `"IIV"` | 5 | **3** |
| `"IIX"` | 10 | **8** |
| `"IIC"` | 100 | **98** |
| `"IIM"` | 1000 | **998** |

On `"IIX"` the left-to-right rule subtracts only the second `I`, because only it
has a larger symbol immediately after. The right-to-left rule subtracts both,
because both are smaller than the largest seen. Neither is wrong — `"IIX"` is not
a Roman numeral, so the specification says nothing about it.

The point is that two implementations agreeing on every input in the specified
domain tells you nothing about how they behave outside it, and here "outside it"
is half of everything.

## The lookup structure is worth 6.5x

Parsing all 3,999 numerals — 30,000 characters — per pass:

| Implementation | Microseconds per pass | Nanoseconds per numeral |
|---|---|---|
| `unordered_map<char,int>` | 147.19 | 36.8 |
| `switch` statement | 107.83 | 27.0 |
| **128-entry table** | **22.58** | **5.6** |
| **Table, right to left** | **17.74** | **4.4** |
| Table, carrying the previous value | 18.10 | 4.5 |

**6.5x from replacing the hash map with an array**, and a further 1.27x from
removing the second lookup per character. This is the same result **Maximum
Nesting Depth of the Parentheses** measured at 3.7x, from the same cause: the key
is a character, and a character is already an index. Hashing it to reach a
seven-entry table is work spent to avoid arithmetic.

Per single numeral — which is what the problem actually asks, with a maximum
length of 15:

| Numeral | Hash map | `switch` | Table | Table, right to left |
|---|---|---|---|---|
| `"III"` | 0.0098us | 0.0060us | 0.0033us | **0.0018us** |
| `"MCMXCIV"` | 0.0232us | 0.0155us | 0.0042us | **0.0032us** |
| `"MMMDCCCLXXXVIII"` | 0.0500us | 0.0379us | 0.0078us | **0.0060us** |

Every one of these is nanoseconds. At the stated constraint the choice is
invisible; it becomes real when numerals are parsed in bulk.

## Python: right to left wins by more

| Implementation | Microseconds per pass | Nanoseconds per numeral |
|---|---|---|
| **Right to left** | **1,562.1** | **390.6** |
| `zip(s, s[1:])` pairs | 2,609.1 | 652.4 |
| `replace` the six pairs, then sum | 2,864.8 | 716.4 |
| Left to right with lookahead | 3,212.5 | 803.3 |
| Matching the six pairs explicitly | 4,020.9 | 1,005.5 |

**2.06x** for the right-to-left scan over the textbook one, against 1.27x in C++,
because a Python dict lookup costs far more than an array index — so halving the
number of lookups matters more.

Note the bottom row. Explicitly checking for each two-character pair is the most
literal reading of the rules and the **slowest** implementation measured, because
it does a slice and a dict membership test per position. The shortest description
of the rules is not the cheapest way to apply them.

<!-- @intuition -->
The rules as written are a list of six exceptions, and the useful move is to notice that the six are not really six — they are one condition seen from different denominations. A symbol is subtracted exactly when something bigger follows it, and every valid numeral obeys that because the six pairs are the only places a valid numeral ever puts a small symbol first. Once you see it that way the special cases disappear into a comparison, and the code stops needing to know what `IV` means. The second idea is about what this function actually is. It looks like a parser and behaves like an evaluator: it consumes any sequence of Roman symbols and produces a number, so it accepts `IL` and `VV` and `IIX` without complaint, which is 96% of the strings you could hand it. That is fine when the problem promises valid input and misleading the moment it does not — and it is why two implementations that pass identical tests on every real numeral can still differ on half of everything else.

<!-- @approach -->
### Match the Six Subtractive Pairs

<!-- @idea -->
Read the rules literally: check for each two-character subtractive pair first, and fall back to single symbols.

<!-- @steps -->
1. Build a table of the six subtractive pairs and their values.
2. Start at the first character with a total of zero.
3. If the next two characters form one of the six pairs, add its value and advance by two.
4. Otherwise add the single symbol's value and advance by one.
5. Return the total when the string is exhausted.

<!-- @complexity -->
- time: O(n) — each character consumed once, with a two-character lookup at each step
- space: O(1) — two fixed tables
- note: The most faithful transcription of the rules and the slowest thing measured, at 4,020.9 microseconds per pass over 3,999 numerals in Python against 1,562.1 for the right-to-left scan — because every position costs a slice and a dictionary membership test. It is worth writing once to see that the six pairs are all covered by a single comparison, and then not writing again.

<!-- @code cpp -->
```cpp
#include <string>
#include <unordered_map>
using namespace std;

int romanToInt(const string& s) {
    static const unordered_map<string, int> pairs = {
        {"IV", 4}, {"IX", 9}, {"XL", 40},
        {"XC", 90}, {"CD", 400}, {"CM", 900}};
    static const unordered_map<char, int> single = {
        {'I', 1}, {'V', 5}, {'X', 10}, {'L', 50},
        {'C', 100}, {'D', 500}, {'M', 1000}};

    int total = 0;
    size_t i = 0;
    while (i < s.size()) {
        if (i + 1 < s.size()) {
            auto it = pairs.find(s.substr(i, 2));
            if (it != pairs.end()) { total += it->second; i += 2; continue; }
        }
        total += single.at(s[i]);
        i++;
    }
    return total;
}
```

<!-- @annotations -->
- 17: `s.substr(i, 2)` allocates a string at every position just to look it up. This line is why the literal version is the slowest one here.
- 6: Six entries in a hash map. The whole point of the next approach is that this table never needs to exist.

<!-- @code java -->
```java
static int romanToInt(String s) {
    Map<String, Integer> pairs = Map.of("IV", 4, "IX", 9, "XL", 40,
                                        "XC", 90, "CD", 400, "CM", 900);
    Map<Character, Integer> single = Map.of('I', 1, 'V', 5, 'X', 10, 'L', 50,
                                            'C', 100, 'D', 500, 'M', 1000);
    int total = 0, i = 0;
    while (i < s.length()) {
        if (i + 1 < s.length() && pairs.containsKey(s.substring(i, i + 2))) {
            total += pairs.get(s.substring(i, i + 2));
            i += 2;
        } else {
            total += single.get(s.charAt(i));
            i++;
        }
    }
    return total;
}
```

<!-- @annotations -->
- 8: `substring` is called twice for the same range — once to test and once to fetch. `getOrDefault` with a single call, or `Map.Entry` lookup, halves the allocation.

<!-- @code python -->
```python
SUB = {"IV": 4, "IX": 9, "XL": 40, "XC": 90, "CD": 400, "CM": 900}
VAL = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def roman_to_int(s):
    total = 0
    i = 0
    while i < len(s):
        if i + 1 < len(s) and s[i:i + 2] in SUB:
            total += SUB[s[i:i + 2]]
            i += 2
        else:
            total += VAL[s[i]]
            i += 1
    return total


# The slowest of five measured: 4,020.9us per pass over 3,999 numerals,
# against 1,562.1 for the right-to-left scan. A slice and a membership
# test at every position.
```

<!-- @annotations -->
- 9: `s[i:i + 2]` builds a new string, then `in SUB` hashes it, then line 10 slices again to fetch. Three operations where a comparison would do.

<!-- @approach -->
### Map Each Symbol, Look Ahead One

<!-- @idea -->
Subtract a symbol when the one after it is larger, and add it otherwise — the six pairs need never be named.

<!-- @steps -->
1. Start the total at zero.
2. Walk the string from left to right.
3. Look up the current symbol's value.
4. If there is a next symbol and its value is larger, subtract the current value.
5. Otherwise add it.
6. Return the total.

<!-- @complexity -->
- time: O(n) — one pass, two symbol lookups per character
- space: O(1) for the value table
- note: The textbook answer, and correct on every canonical numeral from 1 to 3999 with zero mismatches. Its cost is two lookups per character, because it resolves both the current symbol and the next one on every iteration — measured 22.58 microseconds per pass with a table against 17.74 for the right-to-left version that looks up each character once. With a `unordered_map` instead of a table it measures 147.19, or **6.5x** worse.

<!-- @code cpp -->
```cpp
#include <string>
#include <unordered_map>
using namespace std;

int romanToInt(const string& s) {
    static const unordered_map<char, int> value = {
        {'I', 1}, {'V', 5}, {'X', 10}, {'L', 50},
        {'C', 100}, {'D', 500}, {'M', 1000}};

    int total = 0;
    for (size_t i = 0; i < s.size(); i++) {
        int v = value.at(s[i]);
        if (i + 1 < s.size() && v < value.at(s[i + 1])) total -= v;
        else total += v;
    }
    return total;
}
```

<!-- @annotations -->
- 13: Two hash lookups per character — the current symbol and the next. Carrying the previous lookup across iterations, or scanning right to left, removes half of them. The bounds check is needed on every iteration too, because the last character has nothing after it; scanning the other way removes that as well.

<!-- @code java -->
```java
static int romanToInt(String s) {
    Map<Character, Integer> value = Map.of('I', 1, 'V', 5, 'X', 10, 'L', 50,
                                           'C', 100, 'D', 500, 'M', 1000);
    int total = 0;
    for (int i = 0; i < s.length(); i++) {
        int v = value.get(s.charAt(i));
        if (i + 1 < s.length() && v < value.get(s.charAt(i + 1))) total -= v;
        else total += v;
    }
    return total;
}
```

<!-- @annotations -->
- 6: `Map<Character, Integer>` boxes both the key and the value on every lookup. A plain `int[128]` avoids all of it.

<!-- @code python -->
```python
VAL = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def roman_to_int(s):
    total = 0
    for i, c in enumerate(s):
        v = VAL[c]
        if i + 1 < len(s) and v < VAL[s[i + 1]]:
            total -= v
        else:
            total += v
    return total


# 3,212.5us per pass over 3,999 numerals, against 1,562.1 for the
# right-to-left scan -- 2.06x, entirely from doing two dict lookups per
# character instead of one.
```

<!-- @annotations -->
- 8: Two dict lookups and a bounds check per character. In Python a dict lookup is expensive enough that halving their number is worth more than it is in C++.

<!-- @approach -->
### Optimal - Scan Right to Left

<!-- @idea -->
Walk backwards carrying the largest value seen so far; anything smaller than it is being subtracted.

<!-- @steps -->
1. Start the total at zero and the largest-seen value at zero.
2. Walk the string from the last character to the first.
3. Look up this symbol's value.
4. If it is smaller than the largest seen, subtract it.
5. Otherwise add it, and make it the new largest seen.
6. Return the total.

<!-- @complexity -->
- time: O(n) — one pass, exactly one symbol lookup per character
- space: O(1) for the value table and two integers
- note: The one to write. One lookup per character instead of two and no bounds check for a lookahead — measured 17.74 microseconds per pass against 22.58 for the left-to-right table version in C++, and **1,562.1 against 3,212.5 in Python, a 2.06x gap**, because a dict lookup costs more than an array index so halving them matters more. It agrees with the left-to-right version on all 3,999 canonical numerals and differs on 50.34% of invalid symbol strings, which is a fact about the invalid ones rather than about either algorithm.

<!-- @code cpp -->
```cpp
#include <array>
#include <string>
using namespace std;

static constexpr array<short, 128> makeValues() {
    array<short, 128> t{};
    t['I'] = 1;    t['V'] = 5;    t['X'] = 10;   t['L'] = 50;
    t['C'] = 100;  t['D'] = 500;  t['M'] = 1000;
    return t;
}

int romanToInt(const string& s) {
    static constexpr auto VALUE = makeValues();
    int total = 0, largest = 0;
    for (int i = (int)s.size() - 1; i >= 0; i--) {
        int v = VALUE[(unsigned char)s[i]];
        if (v < largest) total -= v;
        else { total += v; largest = v; }
    }
    return total;
}
```

<!-- @annotations -->
- 16: One lookup, no peek at a neighbour, and no bounds check — the loop index alone bounds everything.
- 17: `largest` only ever rises, which is the running-best skeleton from **Largest Element** doing the work that a lookahead was doing.
- 5: A `constexpr` function rather than a C-style designated initialiser, which is not standard C++ and which MSVC rejects even though clang and gcc accept it.

<!-- @code java -->
```java
static final int[] VALUE = new int[128];
static {
    VALUE['I'] = 1;   VALUE['V'] = 5;   VALUE['X'] = 10;  VALUE['L'] = 50;
    VALUE['C'] = 100; VALUE['D'] = 500; VALUE['M'] = 1000;
}

static int romanToInt(String s) {
    int total = 0, largest = 0;
    for (int i = s.length() - 1; i >= 0; i--) {
        int v = VALUE[s.charAt(i)];
        if (v < largest) total -= v;
        else { total += v; largest = v; }
    }
    return total;
}
```

<!-- @annotations -->
- 10: A plain `int[]` indexed by the character — no boxing, no hashing, and no `Map` object to construct on every call.

<!-- @code python -->
```python
VAL = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def roman_to_int(s):
    total = 0
    largest = 0
    for c in reversed(s):
        v = VAL[c]
        if v < largest:
            total -= v
        else:
            total += v
            largest = v
    return total


# The fastest of five measured in Python: 1,562.1us per pass over 3,999
# numerals, against 3,212.5 for the lookahead version -- 2.06x.
```

<!-- @annotations -->
- 7: `reversed(s)` yields characters without building a reversed copy, so this costs nothing over a forward loop.
- 8: One dict lookup per character. That single change is the whole 2.06x.

<!-- @approach -->
### Replace the Map With a Table

<!-- @idea -->
The key is a character, so index an array directly instead of hashing.

<!-- @steps -->
1. Build a 128-entry array holding each symbol's value at its character code, zero elsewhere.
2. Scan the string as before, right to left.
3. Index the array with the character instead of looking it up in a map.
4. Return the accumulated total.

<!-- @complexity -->
- time: O(n) — one indexed load per character, with no hashing
- space: O(1) — a fixed 128-entry table, built once at compile time
- note: The largest single win available here and the same one **Maximum Nesting Depth of the Parentheses** measured at 3.7x. Parsing 3,999 numerals took 147.19 microseconds with an `unordered_map`, 107.83 with a `switch`, and **22.58 with a table** — **6.5x** over the map. Combined with the right-to-left scan it reaches 17.74. In Python there is no equivalent, since a dict is the only constant-time mapping available and a list indexed by `ord(c)` measured no better.

<!-- @code cpp -->
```cpp
#include <array>
#include <string>
using namespace std;

static constexpr array<short, 128> makeValues() {
    array<short, 128> t{};
    t['I'] = 1;    t['V'] = 5;    t['X'] = 10;   t['L'] = 50;
    t['C'] = 100;  t['D'] = 500;  t['M'] = 1000;
    return t;
}
static constexpr auto VALUE = makeValues();

int romanToInt(const string& s) {
    int total = 0;
    for (size_t i = 0; i < s.size(); i++) {
        int v = VALUE[(unsigned char)s[i]];
        total += (i + 1 < s.size() && v < VALUE[(unsigned char)s[i + 1]]) ? -v : v;
    }
    return total;
}
```

<!-- @annotations -->
- 16: `(unsigned char)`, not a plain `char`. A signed `char` makes every byte above 127 a negative index, which reads outside the table.
- 17: Two indexed loads per character. Still 6.5x faster than two hash lookups, and the right-to-left version halves it again.
- 6: 128 entries covers ASCII. A 256-entry table costs 256 more bytes and removes the assumption entirely.

<!-- @code java -->
```java
static final int[] VALUE = new int[128];
static {
    VALUE['I'] = 1;   VALUE['V'] = 5;   VALUE['X'] = 10;  VALUE['L'] = 50;
    VALUE['C'] = 100; VALUE['D'] = 500; VALUE['M'] = 1000;
}

static int romanToInt(String s) {
    int total = 0;
    for (int i = 0; i < s.length(); i++) {
        int v = VALUE[s.charAt(i)];
        total += (i + 1 < s.length() && v < VALUE[s.charAt(i + 1)]) ? -v : v;
    }
    return total;
}
```

<!-- @annotations -->
- 1: A `static final` array built once in a static initialiser, not a `Map` constructed on every call — which is what `Map.of(...)` inside the method body would do.

<!-- @code python -->
```python
VAL = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def roman_to_int(s):
    total = 0
    for a, b in zip(s, s[1:]):
        total += -VAL[a] if VAL[a] < VAL[b] else VAL[a]
    return total + VAL[s[-1]] if s else 0


# Python has no array-index equivalent worth reaching for -- a list
# indexed by ord(c) measured no better than the dict. This zip form is
# 2,609.1us per pass, between the lookahead (3,212.5) and the
# right-to-left scan (1,562.1).
```

<!-- @annotations -->
- 6: `zip(s, s[1:])` pairs each character with its successor and stops one short, which is why the last symbol is added separately on line 8.
- 8: `if s else 0` — `s[-1]` raises on the empty string, and the guard has to be there even though the problem promises a non-empty numeral.

<!-- @example -->

<!-- @input -->
s = "MCMXCIV"

<!-- @output -->
1994

<!-- @why -->
Contains three of the six subtractive pairs, so it exercises the one rule at three different denominations in a single string.

<!-- @walkthrough -->
1. `M` is 1000, and the next symbol `C` is smaller, so it is added — total 1000.
2. `C` is 100 and the next is `M` at 1000, which is larger, so it is subtracted — total 900.
3. `M` is 1000 and the next is `X`, smaller, so it is added — total 1900.
4. `X` is 10 and the next is `C` at 100, larger, so it is subtracted — total 1890.
5. `C` is added, then `I` is subtracted because `V` follows, and `V` is added — total 1994.
6. Scanning right to left instead: `V` is 5 and the largest seen is 0, so add it and record 5.
7. `I` is 1, smaller than 5, so subtract it; `C` is 100, larger, so add and record 100; `X` is smaller, subtract; and so on.
8. Both reach 1994, and neither ever needed to know that `CM` means 900.

<!-- @example -->

<!-- @input -->
s = "IL", s = "VV", s = "IIX" — none of which are Roman numerals

<!-- @output -->
49, 10, and 10 or 8 depending on which scan you wrote

<!-- @why -->
Shows that the standard algorithm evaluates rather than parses, and that the two scan directions do not agree once the input leaves the specified domain.

<!-- @walkthrough -->
1. `IL` is not valid — subtraction is only permitted from the next two denominations up, so 49 is written `XLIX`.
2. The rule does not know that: `I` is smaller than `L`, so it subtracts, giving 49.
3. `VV` is not valid either, since `V` never repeats, but the rule adds 5 twice and returns 10.
4. Over all 19,607 symbol strings of length 1 to 5, the algorithm returns a number for every one and only 735 are canonical — it accepts **96.25%** that are not numerals.
5. On `IIX` the left-to-right rule subtracts only the second `I`, because only it is followed by something larger, giving 10.
6. The right-to-left rule subtracts both `I`s, because both are smaller than the largest seen, giving 8.
7. The two scans disagree on 9,870 of the 19,607 strings — 50.34% — and on **zero** of the 3,999 canonical numerals.
8. Neither is wrong; the specification says nothing about input that is not a numeral.

<!-- @example -->

<!-- @input -->
All 3,999 canonical numerals, parsed once per pass, five ways in C++

<!-- @output -->
147.19us with a hash map, 22.58 with a table, 17.74 scanning right to left

<!-- @why -->
Isolates two independent wins — the lookup structure and the number of lookups — on the same algorithm.

<!-- @walkthrough -->
1. The 3,999 numerals total 30,000 characters, the longest being `MMMDCCCLXXXVIII` at 15.
2. All five implementations were cross-checked against every numeral with zero mismatches.
3. `unordered_map<char,int>` hashes a character to reach a seven-entry table: 147.19 microseconds per pass.
4. A `switch` avoids the hashing but keeps the branching: 107.83.
5. A 128-entry array indexed by the character: **22.58** — 6.5x faster than the map.
6. That is the same finding as **Maximum Nesting Depth of the Parentheses**, where the equivalent change was worth 3.7x — the key is a character, and a character is already an index.
7. Scanning right to left removes the second lookup per character: **17.74**, a further 1.27x.
8. In Python the second change is worth more than the first — 2.06x — because a dict lookup costs far more than an array index.

<!-- @example -->

<!-- @input -->
A single numeral, which is what the problem actually asks

<!-- @output -->
0.0060us for the longest possible numeral, 0.0018us for "III"

<!-- @why -->
Puts the optimisation work in proportion against the stated constraint of at most 15 characters.

<!-- @walkthrough -->
1. The stated range is 1 to 3999, so the longest valid input is 15 characters.
2. `"MMMDCCCLXXXVIII"` measured 0.0500 microseconds with a hash map and 0.0060 with a right-to-left table scan.
3. `"MCMXCIV"` measured 0.0232 and 0.0032; `"III"` measured 0.0098 and 0.0018.
4. Every one of these is single-digit nanoseconds to tens of nanoseconds.
5. So at the problem's own constraint the entire choice is invisible.
6. The 6.5x becomes real only when numerals are parsed in bulk — a column in a dataset, a log format, a corpus.
7. That is the honest framing for every optimisation in this container: correct first, and the table only when something is actually parsing at volume.

<!-- @visualization custom -->

<!-- @description -->
Lay the numeral out as a row of symbol cells with each one's value printed beneath it, then run the left-to-right scan with a sign badge appearing over every cell — plus by default, flipping to minus the moment the cell to its right shows a larger value. Draw the comparison as an explicit arrow from each cell to its neighbour so the lookahead is visible as a second read, and keep a lookup counter running at two per character. Then rerun the same numeral right to left with a single high-water bar trailing behind the cursor: each cell compares against the bar rather than against a neighbour, the arrow to the right disappears, and the lookup counter now advances one per character. The two counters ending at 2n and n is the whole performance story. The centre of the figure is the acceptance problem. Draw a large region labelled all strings over IVXLCDM, 19,607 of them at length 1 to 5, and shade the tiny sub-region of 735 that are actually Roman numerals — 3.75%, drawn to scale so the sliver is startling. Show the algorithm as a funnel that every string passes through and out of which a number always emerges, with `IL` producing 49 beside the real numeral `XLIX`, and `VV` producing 10 beside `X`. Then overlay the disagreement: within the same big region, hatch the 9,870 strings where the two scan directions differ — half of it — and show that the hatching does not touch the 735-string sliver at all. That containment is the point: identical on everything specified, different on half of everything else, with `IIX` shown twice reading 10 and 8. Close with the two independent speed wins as a small waterfall: 147.19us for the hash map, dropping to 107.83 for a switch, to 22.58 for a table, to 17.74 for the table read once per character — and beside it, greyed out, a single numeral at 0.0060us captioned at the stated constraint this is all invisible.

<!-- @sampleInput -->
```json
{"primary":{"s":"MCMXCIV","answer":1994,"breakdown":[{"symbol":"M","value":1000,"next":"C","sign":"+"},{"symbol":"C","value":100,"next":"M","sign":"-"},{"symbol":"M","value":1000,"next":"X","sign":"+"},{"symbol":"X","value":10,"next":"C","sign":"-"},{"symbol":"C","value":100,"next":"I","sign":"+"},{"symbol":"I","value":1,"next":"V","sign":"-"},{"symbol":"V","value":5,"next":null,"sign":"+"}]},"smallCases":[{"s":"III","answer":3},{"s":"LVIII","answer":58},{"s":"MCMXCIV","answer":1994},{"s":"IV","answer":4},{"s":"MMMDCCCLXXXVIII","answer":3888,"note":"the longest numeral, 15 characters"},{"s":"MMMCMXCIX","answer":3999,"note":"the largest value in range"}],"symbols":{"I":1,"V":5,"X":10,"L":50,"C":100,"D":500,"M":1000},"subtractivePairs":{"IV":4,"IX":9,"XL":40,"XC":90,"CD":400,"CM":900},"theOneRule":{"statement":"a symbol is subtracted exactly when the symbol after it is larger","why":"a valid numeral never places a smaller symbol before a larger one except in those six cases, so 'smaller than the next' and 'one of the six pairs' describe the same positions","verification":{"canonicalNumerals":3999,"mismatches":0,"note":"every implementation reproduces every value"}},"evaluatorNotParser":{"claim":"the standard algorithm never rejects anything — it returns a number for any string of Roman symbols","measured":{"allSymbolStringsLength1to5":19607,"returnsANumberFor":19607,"actuallyCanonical":735,"canonicalShare":"3.75%","acceptedButNotNumerals":18872,"acceptedButNotNumeralsShare":"96.25%"},"examples":[{"input":"IL","returns":49,"canonicalFormOfThatValue":"XLIX"},{"input":"IC","returns":99,"canonicalFormOfThatValue":"XCIX"},{"input":"IM","returns":999,"canonicalFormOfThatValue":"CMXCIX"},{"input":"VV","returns":10,"canonicalFormOfThatValue":"X"},{"input":"VX","returns":5,"canonicalFormOfThatValue":"V"}],"collisions":[{"value":1000,"distinctStringsOfLengthUpTo4":41},{"value":1500,"distinctStringsOfLengthUpTo4":37},{"value":1050,"distinctStringsOfLengthUpTo4":35}],"validityCheck":"convert the value back to a numeral and compare — the round trip identifies exactly the 735 canonical strings"},"scanDirectionsDisagree":{"agreeOn":"every one of the 3,999 canonical numerals","disagreeOn":{"strings":9870,"of":19607,"share":"50.34%","canonicalAmongThem":0},"examples":[{"input":"IIV","leftToRight":5,"rightToLeft":3},{"input":"IIX","leftToRight":10,"rightToLeft":8},{"input":"IIC","leftToRight":100,"rightToLeft":98},{"input":"IIM","leftToRight":1000,"rightToLeft":998}],"why":"on IIX the left-to-right rule subtracts only the second I, since only it is followed by something larger; the right-to-left rule subtracts both, since both are smaller than the largest seen","lesson":"two implementations agreeing on every input in the specified domain tells you nothing about how they behave outside it — and here outside it is half of everything"},"benchCpp":{"unit":"microseconds per pass over all 3,999 numerals (30,000 characters), Apple M2, clang -O2","rows":[{"implementation":"unordered_map<char,int>","usPerPass":147.19,"nsPerNumeral":36.8},{"implementation":"switch statement","usPerPass":107.83,"nsPerNumeral":27.0},{"implementation":"128-entry table","usPerPass":22.58,"nsPerNumeral":5.6},{"implementation":"table, right to left","usPerPass":17.74,"nsPerNumeral":4.4},{"implementation":"table, carrying previous value","usPerPass":18.10,"nsPerNumeral":4.5}],"tableVsMap":"6.5x","rightToLeftVsLookahead":"1.27x","sameFindingAs":"Maximum Nesting Depth of the Parentheses measured 3.7x for the same change — the key is a character, and a character is already an index","singleNumeral":[{"numeral":"III","hashMap":0.0098,"switchStmt":0.0060,"table":0.0033,"tableRightToLeft":0.0018},{"numeral":"MCMXCIV","hashMap":0.0232,"switchStmt":0.0155,"table":0.0042,"tableRightToLeft":0.0032},{"numeral":"MMMDCCCLXXXVIII","hashMap":0.0500,"switchStmt":0.0379,"table":0.0078,"tableRightToLeft":0.0060}],"proportion":"at the stated 15-character constraint every choice here is nanoseconds and invisible; the 6.5x is real only when parsing numerals in bulk"},"benchPython":{"unit":"microseconds per pass over all 3,999 numerals, CPython 3.13.4","rows":[{"implementation":"right to left","usPerPass":1562.1,"nsPerNumeral":390.6},{"implementation":"zip(s, s[1:]) pairs","usPerPass":2609.1,"nsPerNumeral":652.4},{"implementation":"replace the six pairs, then sum","usPerPass":2864.8,"nsPerNumeral":716.4},{"implementation":"left to right with lookahead","usPerPass":3212.5,"nsPerNumeral":803.3},{"implementation":"matching the six pairs explicitly","usPerPass":4020.9,"nsPerNumeral":1005.5}],"rightToLeftVsLookahead":"2.06x, against 1.27x in C++, because a dict lookup costs far more than an array index so halving their number matters more","slowestIsMostLiteral":"explicitly checking each two-character pair is the most faithful reading of the rules and the slowest implementation measured — a slice and a membership test per position"},"assertions":["the answer is between 1 and 3999 for a valid numeral","the value round-trips: converting it back to a numeral reproduces the input exactly, for valid input only","a symbol is subtracted exactly when a larger symbol follows it","the six subtractive pairs are the only places a valid numeral puts a smaller symbol first","both scan directions give the same answer on every canonical numeral"],"recommendation":"scan right to left carrying the largest value seen — one lookup per character, no lookahead, no bounds check; use a table rather than a hash map if numerals are parsed in bulk","lesson":"the six exceptions are one comparison, and the function that applies it is an evaluator rather than a parser — it answers for 96% of strings that are not numerals at all"}
```

<!-- @highlights -->
- The numeral is laid out as symbol cells with each value printed beneath, and a sign badge appears over every cell as the left-to-right scan runs.
- Badges show plus by default and flip to minus the moment the cell to the right shows a larger value.
- An explicit arrow from each cell to its neighbour makes the lookahead visible as a second read.
- A lookup counter runs at two per character.
- The same numeral then runs right to left with a high-water bar trailing the cursor.
- Each cell compares against the bar instead of a neighbour, the rightward arrow disappears, and the counter advances one per character.
- The two counters ending at 2n and n is the whole performance story.
- The centre draws a large region labelled all strings over IVXLCDM — 19,607 at length 1 to 5.
- A tiny sub-region of 735 actually-Roman numerals is shaded to scale, 3.75%, so the sliver is startling.
- The algorithm appears as a funnel every string passes through, always emitting a number.
- `IL` produces 49 beside the real numeral `XLIX`; `VV` produces 10 beside `X`.
- The 9,870 strings where the two scan directions differ are hatched — half the region.
- The hatching visibly does not touch the 735-string sliver at all.
- `IIX` is shown twice, reading 10 and 8, as the containment argument.
- The close is a waterfall of the two speed wins: 147.19us hash map, 107.83 switch, 22.58 table, 17.74 table read once per character.
- Beside it, greyed out, a single numeral at 0.0060us captioned at the stated constraint this is all invisible.

<!-- @edgeCases -->
- `"I"` — a single symbol, where the lookahead has nothing to peek at and the right-to-left scan has no largest-seen yet.
- `"IV"` — the smallest subtractive pair, and the case that fails if the comparison is written the wrong way round.
- `"MMMCMXCIX"` — 3999, the largest value in range, containing three subtractive pairs.
- `"MMMDCCCLXXXVIII"` — 3888, the longest valid numeral at 15 characters, and the worst case for the stated constraint.
- The empty string — outside the guarantee; the Python `zip` version raises on `s[-1]` without a guard, while the loops return 0.
- `"IL"` or `"IC"` — plausible-looking and not valid; the algorithm returns 49 and 99 without complaint.
- `"IIX"` — where the two scan directions return 10 and 8, the smallest disagreement between them.
- Repeated symbols that a real numeral forbids, like `"VV"` or `"IIII"` — evaluated happily as 10 and 4.
- Lowercase input — every table lookup returns 0, so the answer is silently 0 rather than an error.
- Any character outside `IVXLCDM` — a 128-entry table returns 0 for it; a `map::at` throws, which is the one case where the map is the safer choice.
- A byte above 127 indexed into the table with a signed `char` — negative subscript and an out-of-bounds read.

<!-- @pitfalls -->
- Enumerating the six subtractive pairs. One comparison covers all of them, and the explicit version measured the slowest of five in Python at 4,020.9 microseconds per pass against 1,562.1.
- Slicing two characters at every position to test for a pair. That is an allocation and a hash per character where a comparison would do.
- Assuming the function validates its input. It returns a number for **96.25%** of symbol strings that are not Roman numerals, including `IL`, `IC` and `VV`.
- Testing two implementations only on valid numerals. The two scan directions agree on all 3,999 and disagree on 50.34% of invalid strings.
- Using `unordered_map<char,int>`. Measured 6.5x slower than a 128-entry array, for a mapping with seven entries whose key is already an index.
- Constructing the value map inside the function. `Map.of(...)` in a Java method body rebuilds it on every call; it belongs in a `static final` field.
- Indexing the table with a signed `char`. Any byte above 127 becomes a negative subscript.
- Forgetting the bounds check on the lookahead. The last character has no successor, and reading past the end is undefined behaviour rather than a wrong answer.
- Writing the comparison backwards. `v > next` instead of `v < next` turns every addition into a subtraction and vice versa, and `"III"` still returns 3, so the smallest test passes.
- Omitting the empty-string guard in the Python `zip` version. `s[-1]` raises, where the explicit loops return 0.
- Optimising this at the stated constraint. The longest valid numeral parses in 0.0060 microseconds; the 6.5x only matters when parsing at volume.

<!-- @doubt -->
### Do I need to handle the six subtractive pairs separately?

<!-- @answer -->
No, and not handling them is both shorter and faster. The single rule — **subtract a symbol when the symbol after it is larger, otherwise add it** — covers all six, because a valid numeral never puts a smaller symbol before a larger one anywhere else. That is what the six pairs *are*. Verified by applying the rule to all 3,999 canonical numerals from 1 to 3999: zero mismatches. Writing the pairs out explicitly is the most literal reading of the rules and the slowest implementation measured, at 4,020.9 microseconds per pass in Python against 1,562.1 for the right-to-left scan, because it costs a two-character slice and a dictionary membership test at every position.

<!-- @doubt -->
### Does this algorithm reject invalid numerals?

<!-- @answer -->
It rejects nothing. Hand it any string of Roman symbols and it returns a number. Over every string of length 1 to 5 drawn from `IVXLCDM` — 19,607 of them — it produced a value for **all of them**, and only **735 (3.75%)** are canonical Roman numerals. So **96.25%** of what it accepts is not a numeral. Some of the accepted junk looks plausible: `IL` returns 49 where the real numeral is `XLIX`, `IC` returns 99, and `VV` returns 10. Many strings also collide — 41 distinct strings of length four or less evaluate to 1000. Against the stated problem this is fine, since valid input is guaranteed. If the input comes from a user or a file, the check is one line: convert the value back to a numeral and compare, which identifies exactly the 735 and nothing else.

<!-- @doubt -->
### Why scan right to left?

<!-- @answer -->
Because it removes the lookahead, and the lookahead is half the work. Going left to right you must resolve the current symbol *and* the next one on every iteration, plus a bounds check because the last character has no successor. Going right to left you carry the largest value seen so far, and anything smaller than it is being subtracted — one lookup per character, no peek, no bounds check. Measured over 3,999 numerals: 17.74 microseconds per pass against 22.58 for the left-to-right table version in C++, and **1,562.1 against 3,212.5 in Python — 2.06x**. The gap is larger in Python because a dict lookup costs far more than an array index, so halving their number is worth more there.

<!-- @doubt -->
### The two scan directions gave different answers. Which one is broken?

<!-- @answer -->
Neither, and the input they disagree about is not a Roman numeral. On `"IIX"` the left-to-right rule looks at each symbol and its immediate successor: the first `I` is followed by another `I`, not larger, so it adds; the second `I` is followed by `X`, so it subtracts — total 10. The right-to-left rule compares each symbol against the largest seen, and both `I`s are smaller than `X`, so both are subtracted — total 8. Measured over all 19,607 symbol strings of length 1 to 5 they disagree on **9,870 — 50.34%** — and on **zero** of the 3,999 canonical numerals. That containment is the useful fact: agreeing on every input the specification covers says nothing about behaviour outside it, and here outside it is half of everything.

<!-- @doubt -->
### Is a hash map really that much slower than an array?

<!-- @answer -->
6.5x here, measured. Parsing all 3,999 numerals took 147.19 microseconds with `unordered_map<char,int>`, 107.83 with a `switch`, and **22.58 with a 128-entry array**. The map hashes a character, selects a bucket and follows a pointer to reach a table with seven entries in it — all to arrive somewhere that `VALUE[c]` reaches with an addition. This is the same result **Maximum Nesting Depth of the Parentheses** measured at 3.7x for the identical change, and the rule generalises: whenever the key space is small and dense, indexing beats hashing, and a character key is the canonical case. The one thing the map gives you is that `at()` throws on an unknown symbol, where a table silently returns 0.

<!-- @doubt -->
### Should I actually bother with any of this?

<!-- @answer -->
Not for the problem as stated. The range is 1 to 3999, so the longest possible input is 15 characters, and the longest numeral `"MMMDCCCLXXXVIII"` parsed in **0.0060 microseconds** with the fastest version and 0.0500 with the slowest. Both are invisible. Write the right-to-left scan because it is shorter and has fewer places to go wrong — no bounds check, no lookahead, no pair table — not because it is faster. The 6.5x from the lookup table becomes real only when numerals are being parsed in bulk: a column in a dataset, a log format, a corpus of inscriptions. That is the honest proportion for every measurement in this container.

<!-- @doubt -->
### What happens with lowercase or unexpected characters?

<!-- @answer -->
It depends on the lookup, and the difference matters more than the speed. A 128-entry table returns **0** for any character that is not one of the seven symbols, so lowercase `"mcmxciv"` silently evaluates to 0 rather than 1994 — a wrong answer with no signal. `unordered_map::at` throws `std::out_of_range` instead, and Java's `Map.get` returns `null`, which throws on unboxing. So the map is the safer default and the table is the faster one, which is a real trade rather than a free win. If you use the table and the input is not guaranteed, either upper-case the input first or check that every character maps to a non-zero value — one comparison inside the loop you already have. A byte above 127 is worse still: with a signed `char` index it reads outside the table entirely.
