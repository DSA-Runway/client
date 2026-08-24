---
id: letter-combinations-of-a-phone-number
topic: Advanced Recursion
title: Letter Combinations of a Phone Number
difficulty: Hard
status: ready
prerequisites:
  - word-break
  - power-set
  - learn-all-patterns-of-subsequences-theory
  - generate-parentheses
  - time-and-space-complexity-basics
relatedIds:
  - word-break
  - power-set
  - generate-parentheses
  - learn-all-patterns-of-subsequences-theory
  - palindrome-partitioning
---

<!-- @summary -->
The reset Word Break promised: no guard to evaluate, no state to memoise, every leaf an answer. What is left is the cost of writing the answer down, and three measurements say the usual advice is aimed at the wrong things. Carrying the partial by value — the sin **Learn All Patterns** measured at 37.1x — costs only **1.37x** here, because a combination is short enough to live inside the string object and never touches the heap: 65,536 combinations take **17 allocations**, and one with `reserve`. Removing three-quarters of the calls is worth exactly **1.00x** in C++ and **1.70x** in Python. And the branching factor is four, not three, so a ten-digit number of 7s and 9s has **1,048,576** combinations against 59,049 — 17.76x.

<!-- @theory -->
## The problem

Each digit on a phone keypad maps to letters. Given a digit string, list every
string you get by choosing one letter per digit.

```
2 -> abc    3 -> def    4 -> ghi    5 -> jkl
6 -> mno    7 -> pqrs   8 -> tuv    9 -> wxyz

"23"  ->  ad ae af bd be bf cd ce cf      (9 combinations)
```

The recursion is the shortest in the topic: at digit `i`, loop over its letters,
append one, recurse to `i + 1`, remove it.

## The tree has nothing to refuse and nothing to repeat

Every problem in the medium set was about one of two pathologies. Combination
Sum measured **80.7%** of its nodes as dead ends and needed a guard. Word Break
had no dead ends at all but reached the same position by many routes, and needed
a memo. This tree has neither.

Measured over twenty digit strings, random and adversarial, the dead-end count is
**0** and the number of distinct outputs equals the number of leaves every time —
no branch fails, and no two branches produce the same string. Combination Sum III
also reached 0% dead ends, but it got there by *building a complete guard*. Here
there is no guard to build. Nothing is illegal, so nothing can be refused.

That makes the node count exact rather than estimated. With branching factors
`b₁…b_k`, the leaves are `∏bᵢ` and the calls are the sum of the prefix products:

| digits | combinations | `∏bᵢ` | calls | prefix-product sum |
|---|---|---|---|---|
| `23` | 9 | 9 | 13 | 13 |
| `234` | 27 | 27 | 40 | 40 |
| `7979` | 256 | 256 | 341 | 341 |
| `23456789` | 11,664 | 11,664 | 15,916 | 15,916 |
| `77777777` | 65,536 | 65,536 | 87,381 | 87,381 |

Exact at every row. For an all-four-letter input the calls are `(4^(k+1) − 1)/3`,
which is `1.3333` nodes per leaf — the tree is barely larger than its own output.

## The branching factor is not three

`7` and `9` carry four letters, not three, and the usual `O(3^n)` gloss quietly
ignores it. The worst case is `4^k`:

| k | all three-letter | all four-letter | ratio |
|---|---|---|---|
| 4 | 81 | 256 | 3.16x |
| 7 | 2,187 | 16,384 | 7.49x |
| 8 | 6,561 | 65,536 | 9.99x |
| 10 | 59,049 | **1,048,576** | **17.76x** |

The gap is `(4/3)^k`, so it grows without bound. A ten-digit number of 7s and 9s
produces a **million** combinations where the `3^n` estimate predicts fifty-nine
thousand. That is the difference between an answer and an out-of-memory.

## What the tree costs, and what the answer costs

Power Set found that materialising the output cost 15.8x the traversal, because
the output was `n/2` times bigger than the tree. The same split here, measured
with each form in its own process:

| | traversal only | writing the strings | ratio |
|---|---|---|---|
| `23456789` (11,664) | 26.79µs | 83.96µs | **3.13x** |
| `77777777` (65,536) | 141.62µs | 451.08µs | **3.19x** |
| `7777777777` (1,048,576) | 2,266.96µs | 7,440.50µs | **3.28x** |

Flat at roughly 3.2x, and the reason it is 3.2 rather than Power Set's 15.8 is
that here the output is only `k` characters per leaf against a tree of `4/3`
nodes per leaf — a much smaller multiple than a power set's. The recursion itself
costs a steady **6.7 to 7.0 nanoseconds per combination** from k = 6 to k = 10,
with no scaling pathology anywhere.

## The partial fits inside the string object

**Learn All Patterns of Subsequences** measured carrying the partial by value at
**37.1x** slower than carrying it by reference, and that figure has governed
every container since. It does not hold here:

| | `77777777` | `7777777777` |
|---|---|---|
| one buffer, pushed and popped | 451.08µs | 7,440.50µs |
| a new string on every edge | 618.96µs | 7,182.96µs |
| ratio | **1.37x** | **0.97x** |

At a million combinations the by-value form is not slower at all. The reason is
`std::string`'s small-string optimisation. Counting every call to global
`operator new` while generating 65,536 combinations of eight characters:

| | allocations | bytes |
|---|---|---|
| one buffer, pushed and popped | **17** | 3,145,704 |
| a new string on every edge | **17** | 3,145,704 |
| one buffer + `reserve` | **1** | 1,572,864 |

Not 65,536 allocations — seventeen, and all seventeen are the output vector
doubling. `sizeof(std::string)` is 24 bytes and its inline capacity is **22
characters**, so a combination is stored inside the string object itself and
never reaches the heap. Copying the partial is a 24-byte register-and-stack copy,
not an allocation, which is why it costs 1.37x instead of 37x.

And it can never be otherwise. A combination longer than 22 characters needs 23
digits, which needs at least `3^23` = **94,143,178,827** outputs. The heap path
for these strings exists but is unreachable.

## Reserve halves the memory

The 1.06x it buys in time is not the reason to write it. Peak RSS, each run in
its own process:

| k | combinations | no `reserve` | with `reserve` | bytes per combination |
|---|---|---|---|---|
| 8 | 65,536 | 4.31 MB | 2.78 MB | 48.5 → **24.0** |
| 9 | 262,144 | 13.38 MB | 7.30 MB | 48.4 → **24.1** |
| 10 | 1,048,576 | **49.39 MB** | **25.28 MB** | 48.1 → **24.0** |

Exactly 24.0 bytes per combination with `reserve` — one `std::string` object,
confirming again that nothing else was allocated. Exactly **2x** that without it,
because the final doubling holds the old buffer and the new one at the same
moment. The output size is known in closed form before the search starts, so
there is no excuse for paying it. Traversal alone held peak RSS at the 1.28 MB
baseline at every k.

## Removing three-quarters of the calls buys nothing

**Generate Parentheses** measured that testing the constraint on entry rather
than before descending cost a steady **1.60x**, and the lesson looked general.
It is not.

Emitting at the last digit instead of recursing into a leaf call removes the
entire bottom level of the tree — on an all-four-letter input, exactly **4.00x**
fewer calls:

| | calls | C++ | Python |
|---|---|---|---|
| test on entry | 1,398,101 | 7,053µs | 154.10ms |
| emit at the last digit | 349,525 | 7,096µs | 90.90ms |
| | **4.00x fewer** | **1.00x** | **1.70x** |

In C++ the restructured version is, if anything, marginally slower. The removed
calls were not doing wasted work — they *were* the emitting calls, and moving the
`push_back` up one level leaves the same number of string writes. Generate
Parentheses' extra calls built candidates and then rejected them; these build the
answer. **A node count is a proxy for cost only when the nodes do work.**

Power Set found the identical split — 1.00x in C++, and a real win in Python —
for the same reason: an interpreted call has a cost floor a compiled one does
not.

## The iterative form, and a measurement that lied

Building level by level, with no recursion at all, is competitive and then better:

| k | recursion | iterative | ratio |
|---|---|---|---|
| 6 | 27.83µs | 26.54µs | 0.95x |
| 8 | 451.08µs | 483.12µs | 1.07x |
| 9 | 1,810.96µs | 1,331.54µs | **0.735x** |
| 10 | 7,440.50µs | 4,481.79µs | **0.60x** |

The step between k = 8 and k = 9 reproduced to three decimal places across
trials and survived a 300ms full-clock warmup, so it is neither noise nor
frequency ramping.

Timing each level *inside* the full build appeared to explain it: the cost per
string looked flat at ~5.5ns up to level 8 and then dropped to 3.15ns. That
explanation was wrong. Building one level standalone, in its own process, the
cost is **flat at 3.1–3.5ns per string from 16,384 to 4,194,304 strings**, fresh
buffer or reused — no discontinuity at any size. The per-level figures had
measured the preceding levels' effect on the allocator and the caches, not the
level itself.

So the crossover is real and lives in the memory system rather than in the
algorithm: both forms perform the same string constructions, and the recursion's
own cost per combination is flat. That is as far as the measurement supports, and
further than the per-level numbers would have taken it.

## Python wants the opposite code

The C++ advice — one buffer, push and pop, never build a string per edge —
inverts under an interpreter:

| | `77777777` | `7777777777` |
|---|---|---|
| traversal only | 6.01ms | 97.19ms |
| recursion, list + `"".join` | 10.16ms | 174.69ms |
| recursion, `cur + ch` | **7.89ms** | **127.44ms** |
| iterative comprehension | **2.98ms** | **58.55ms** |
| `itertools.product` + `map` | **2.98ms** | **56.66ms** |

Concatenation beats the list-and-join buffer by **1.29x and 1.37x** — the
append/pop/join costs three interpreted operations where `cur + ch` costs one,
and the strings are far too short for the quadratic-concatenation argument to
apply. The comprehension beats the recursion by **3.0–3.4x**, and
`itertools.product` merely matches it, because both are the same C loop.

Note also the balance: in Python the bare tree walk is 59% of the total, against
31% in C++. Interpreted call overhead makes the traversal expensive and the
string writing comparatively cheap, which is exactly why the call-removing
rewrite pays there and not here.

## Where this goes next

**Palindrome Partitioning** brings the guard back, and with it the cost model
this subtopic does not have: the branch test stops being free, so the arithmetic
turns from counting nodes to counting node × test. This container is the
baseline that makes that comparison legible — the last one where every node
reached is a node that pays.

<!-- @intuition -->
This is the simplest tree in the topic and it is here, at the head of the Hard set, on purpose. There is no guard, so no branch is ever refused; there are no repeated states, so nothing is worth memoising; every leaf is an answer and every node is on the path to one. Once you see that, the interesting question stops being "how do I avoid work" and becomes "what does writing the answer actually cost" — and that is where the received advice turns out to be aimed at the wrong things. Passing the partial string by value, the cardinal sin of this topic, costs almost nothing here, because a combination is short enough to live inside the string object and never reach the heap. Removing three-quarters of the recursive calls buys nothing in C++, because those calls were the ones writing the output rather than wasting time. What does matter is dull by comparison: the branching factor is four rather than three on two of the eight keys, which is a 17.76x difference on a ten-digit input, and reserving the output vector halves peak memory because you already know the answer's exact size before you start. The general lesson is that a node count is a proxy for cost only when the nodes do work, and here they all do.

<!-- @approach -->
### Brute Force - A New String on Every Edge

<!-- @idea -->
Carry the partial combination by value, so each recursive call receives its own copy with one more letter appended.

<!-- @steps -->
1. Return an empty list immediately when the digit string is empty.
2. Carry the index of the current digit and the partial string built so far.
3. When the index reaches the end, the partial is complete — record it.
4. Otherwise look up the letters for the current digit.
5. For each letter, recurse on the next index with the partial plus that letter.
6. Nothing is undone, because each call held its own copy.

<!-- @complexity -->
- time: O(k · 4^k) — one string of length k written per combination
- space: O(k) for the call stack, plus O(k · 4^k) for the output
- note: The version this topic has spent five subtopics warning against, and the first one where the warning does not land. **Learn All Patterns** measured carrying by value at **37.1x**; here it is **1.37x** at 65,536 combinations and **0.97x** at a million. The partial is at most 22 characters, so it lives inside the `std::string` object and the copy never allocates — measured at **17** total allocations either way, all of them the output vector growing.

<!-- @code cpp -->
```cpp
static const string LET[10] = {
    "", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"
};

void rec(const string& digits, int i, string cur, vector<string>& out) {
    if (i == (int)digits.size()) { out.push_back(cur); return; }
    for (char c : LET[digits[i] - '0'])
        rec(digits, i + 1, cur + c, out);
}

vector<string> letterCombinations(string digits) {
    vector<string> out;
    if (digits.empty()) return out;
    rec(digits, 0, "", out);
    return out;
}
```

<!-- @annotations -->
- 5: `string cur` taken by value — a fresh copy per call, and the thing this topic normally forbids. Measured at 1.37x here rather than 37.1x, because the copy fits inline and never reaches the heap.
- 8: A new string per edge. There are `(4^(k+1) − 1)/3` edges, so this is where the work would be if the strings were long enough to allocate.
- 13: The empty-digit guard. Without it the answer comes back as `[""]` — one combination of no letters — which is the single most common wrong answer to this problem.

<!-- @code java -->
```java
static final String[] LET = {
    "", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"
};

static void rec(String digits, int i, String cur, List<String> out) {
    if (i == digits.length()) { out.add(cur); return; }
    for (char c : LET[digits.charAt(i) - '0'].toCharArray())
        rec(digits, i + 1, cur + c, out);
}

static List<String> letterCombinations(String digits) {
    List<String> out = new ArrayList<>();
    if (digits == null || digits.isEmpty()) return out;
    rec(digits, 0, "", out);
    return out;
}
```

<!-- @annotations -->
- 8: `cur + c` compiles to a `StringBuilder` allocation, a copy and a `toString` per edge. Java has no inline-string optimisation, so the C++ result above does not transfer — this really is the wasteful form here.

<!-- @code python -->
```python
LET = {"0": "", "1": "", "2": "abc", "3": "def", "4": "ghi",
       "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}


def letter_combinations(digits):
    if not digits:
        return []
    out = []

    def rec(i, cur):
        if i == len(digits):
            out.append(cur)
            return
        for c in LET[digits[i]]:
            rec(i + 1, cur + c)

    rec(0, "")
    return out
```

<!-- @annotations -->
- 15: In Python this is the **faster** form, not the slower one — measured 1.29x quicker than the list-and-join buffer at 65,536 combinations and 1.37x at a million. `cur + c` is one interpreted operation where append/pop/join is three.

<!-- @approach -->
### Optimal - One Buffer, Pushed and Popped

<!-- @idea -->
Keep a single mutable buffer for the whole traversal: append a letter before descending, remove it after.

<!-- @steps -->
1. Return an empty list immediately when the digit string is empty.
2. Compute the product of the digits' letter counts and reserve exactly that much output.
3. Carry the index of the current digit; the buffer is shared, not copied.
4. When the index reaches the end, copy the buffer into the output.
5. Otherwise, for each letter of the current digit, append it to the buffer.
6. Recurse on the next index.
7. Remove the letter, restoring the buffer for the next sibling.

<!-- @complexity -->
- time: O(k · 4^k) — unchanged; the output still has to be written
- space: O(k) for the buffer and the stack, plus the output
- note: The answer to give, though its margin over the by-value form is a modest **1.37x** rather than the 37.1x this topic's earlier measurement would predict. `reserve` on line 20 is the line that earns its place: worth only 1.06x in time but **exactly 2x in peak memory** — 25.28 MB against 49.39 MB at a million combinations — because the output's size is known in closed form before the search begins.

<!-- @code cpp -->
```cpp
static const string LET[10] = {
    "", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"
};

void rec(const string& digits, int i, string& cur, vector<string>& out) {
    if (i == (int)digits.size()) { out.push_back(cur); return; }
    for (char c : LET[digits[i] - '0']) {
        cur.push_back(c);
        rec(digits, i + 1, cur, out);
        cur.pop_back();
    }
}

vector<string> letterCombinations(string digits) {
    vector<string> out;
    if (digits.empty()) return out;

    size_t n = 1;
    for (char d : digits) n *= LET[d - '0'].size();
    out.reserve(n);

    string cur;
    cur.reserve(digits.size());
    rec(digits, 0, cur, out);
    return out;
}
```

<!-- @annotations -->
- 5: `string& cur` — one buffer for the entire traversal, mutated on the way down and restored on the way up.
- 6: The copy into the output. At 24 bytes and no allocation, this is cheaper than it looks — the combination is stored inside the string object, not behind a pointer.
- 10: The `pop_back` that makes this backtracking rather than enumeration. Omit it and the buffer keeps every letter it has ever appended.
- 16: The empty-digit guard, and the reason the answer is `[]` rather than `[""]`.
- 20: Worth 1.06x in time and exactly **2x in peak memory** — without it the final doubling holds the old buffer and the new one simultaneously, measured at 48.1 bytes per combination against 24.0.

<!-- @code java -->
```java
static final String[] LET = {
    "", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"
};

static void rec(String digits, int i, StringBuilder cur, List<String> out) {
    if (i == digits.length()) { out.add(cur.toString()); return; }
    for (char c : LET[digits.charAt(i) - '0'].toCharArray()) {
        cur.append(c);
        rec(digits, i + 1, cur, out);
        cur.deleteCharAt(cur.length() - 1);
    }
}

static List<String> letterCombinations(String digits) {
    if (digits == null || digits.isEmpty()) return new ArrayList<>();

    int n = 1;
    for (char d : digits.toCharArray()) n *= LET[d - '0'].length();

    List<String> out = new ArrayList<>(n);
    rec(digits, 0, new StringBuilder(digits.length()), out);
    return out;
}
```

<!-- @annotations -->
- 6: `toString()` copies the buffer, and unlike C++ that copy does allocate — Java strings are immutable and there is no inline representation to fall back on.
- 10: `deleteCharAt` at the last index is Java's `pop_back`; `setLength(cur.length() - 1)` is the same operation and avoids the bounds arithmetic.
- 20: Presizing the list is the same trick as C++'s `reserve`, for the same reason — the exact answer count is a product of the digits' letter counts and is known before the search starts.

<!-- @code python -->
```python
LET = {"0": "", "1": "", "2": "abc", "3": "def", "4": "ghi",
       "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}


def letter_combinations(digits):
    if not digits:
        return []
    out, cur = [], []

    def rec(i):
        if i == len(digits):
            out.append("".join(cur))
            return
        for c in LET[digits[i]]:
            cur.append(c)
            rec(i + 1)
            cur.pop()

    rec(0)
    return out
```

<!-- @annotations -->
- 12: `"".join(cur)` plus the append and pop below is **three** interpreted operations where `cur + c` is one — measured **1.29x slower** than the by-value form at 65,536 combinations. This is the C++ optimisation transplanted into a language where it does not pay.
- 15: Faithful to the C++ version, and the reason to write it this way in Python is readability rather than speed.

<!-- @approach -->
### Iterative - Build the Level Below

<!-- @idea -->
Hold every partial of length `i`, then replace it with every partial of length `i + 1`, one digit at a time.

<!-- @steps -->
1. Return an empty list immediately when the digit string is empty.
2. Start with a single empty partial.
3. For each digit in turn, look up its letters.
4. Reserve a new list of exactly the current size times the letter count.
5. For every partial held, and every letter of this digit, append the extension.
6. Replace the held list with the new one.
7. After the last digit, the held list is the answer.

<!-- @complexity -->
- time: O(k · 4^k) — the same string writes, driven by a loop
- space: O(4^k) — it holds two adjacent levels at once, rather than one buffer
- note: No recursion, so no stack at all. Measured within 7% of the recursion up to k = 8 and **1.66x faster** at k = 10 — 4,481.79µs against 7,440.50µs. In Python the same restructuring as a comprehension is worth **3.0–3.4x**, and matches `itertools.product`. Its one hazard is line 3: seeded with `[""]`, it returns `[""]` for empty input unless line 2 stops it first.

<!-- @code cpp -->
```cpp
vector<string> letterCombinations(string digits) {
    if (digits.empty()) return {};
    vector<string> cur{""};
    for (char d : digits) {
        const string& letters = LET[d - '0'];
        vector<string> next;
        next.reserve(cur.size() * letters.size());
        for (const string& s : cur)
            for (char c : letters)
                next.push_back(s + c);
        cur.swap(next);
    }
    return cur;
}
```

<!-- @annotations -->
- 3: The seed, and the exact source of the classic wrong answer — `[""]` is one combination of no letters, so without the guard on line 2 an empty input returns it unchanged.
- 7: Each level's size is known before it is built, so every level costs one allocation.
- 11: `swap` rather than assignment, so the previous level is freed rather than copied.

<!-- @code java -->
```java
static List<String> letterCombinations(String digits) {
    List<String> out = new ArrayList<>();
    if (digits == null || digits.isEmpty()) return out;
    out.add("");
    for (char d : digits.toCharArray()) {
        String letters = LET[d - '0'];
        List<String> next = new ArrayList<>(out.size() * letters.length());
        for (String s : out)
            for (char c : letters.toCharArray())
                next.add(s + c);
        out = next;
    }
    return out;
}
```

<!-- @annotations -->
- 3: The guard comes before the seed on line 4, which is the ordering that matters — reversed, every empty input returns a list holding one empty string.

<!-- @code python -->
```python
def letter_combinations(digits):
    if not digits:
        return []
    out = [""]
    for d in digits:
        out = [s + c for s in out for c in LET[d]]
    return out
```

<!-- @annotations -->
- 6: The whole algorithm as one comprehension, and the fastest form measured in Python — **3.41x** the recursion at 65,536 combinations, matching `itertools.product(*(LET[d] for d in digits))` because both run the same loop in C.

<!-- @approach -->
### Emit at the Last Digit

<!-- @idea -->
Stop recursing into leaf calls: at the final digit, write the combination directly from the parent's loop.

<!-- @steps -->
1. Note the index of the last digit before starting.
2. At each node, loop over the current digit's letters.
3. Append the letter to the buffer.
4. If this is the last digit, record the buffer as a finished combination.
5. Otherwise recurse to the next digit.
6. Remove the letter and continue with the next sibling.

<!-- @complexity -->
- time: O(k · 4^k) — unchanged
- space: O(k) stack, one level shallower
- note: Removes the entire bottom level of the tree — **exactly 4.00x** fewer calls on an all-four-letter input, 349,525 against 1,398,101. Measured worth **1.00x** in C++ (7,096µs against 7,053µs, marginally *slower*) and **1.70x** in Python. The calls it deletes were the ones writing the output, not wasting time, so in a compiled language there is nothing to recover. Included because the call-count reduction is dramatic and the payoff is zero, which is the point.

<!-- @code cpp -->
```cpp
void rec(const string& digits, int i, string& cur, vector<string>& out) {
    int last = (int)digits.size() - 1;
    for (char c : LET[digits[i] - '0']) {
        cur.push_back(c);
        if (i == last) out.push_back(cur);
        else rec(digits, i + 1, cur, out);
        cur.pop_back();
    }
}
```

<!-- @annotations -->
- 1: This form has **no base case**, so it must never be called with an empty digit string — the guard in the caller stops being a matter of output correctness and becomes a matter of not indexing past the end.
- 5: Emitting here rather than recursing removes 4.00x of the calls and 1.00x of the running time in C++, against 1.70x in Python. **Generate Parentheses** measured the mirror-image rewrite at a steady 1.60x, because there the extra calls built candidates that were then rejected; here they built answers.

<!-- @code java -->
```java
static void rec(String digits, int i, StringBuilder cur, List<String> out) {
    int last = digits.length() - 1;
    for (char c : LET[digits.charAt(i) - '0'].toCharArray()) {
        cur.append(c);
        if (i == last) out.add(cur.toString());
        else rec(digits, i + 1, cur, out);
        cur.setLength(cur.length() - 1);
    }
}
```

<!-- @annotations -->
- 7: `setLength` undoes the append without the index arithmetic of `deleteCharAt`, and is the idiomatic Java backtracking undo.

<!-- @code python -->
```python
def letter_combinations(digits):
    if not digits:
        return []
    out = []
    last = len(digits) - 1

    def rec(i, cur):
        for c in LET[digits[i]]:
            if i == last:
                out.append(cur + c)
            else:
                rec(i + 1, cur + c)

    rec(0, "")
    return out
```

<!-- @annotations -->
- 9: Where this rewrite actually pays. Python measured **1.70x** for it at a million combinations — 90.90ms against 154.10ms — because an interpreted call has a cost floor that a compiled one does not.

<!-- @example -->

<!-- @input -->
`digits = "23"`

<!-- @output -->
`["ad","ae","af","bd","be","bf","cd","ce","cf"]`

<!-- @why -->
The whole tree small enough to hold in the head, showing that nothing is refused and nothing repeats.

<!-- @walkthrough -->
1. The root calls with `i = 0` and an empty buffer; digit `2` offers `a`, `b`, `c`.
2. Append `a`, recurse to `i = 1`; digit `3` offers `d`, `e`, `f`, giving `ad`, `ae`, `af`.
3. Pop back to the buffer holding just `a`, then pop again to empty, and take `b`.
4. That branch yields `bd`, `be`, `bf`, and `c` yields `cd`, `ce`, `cf`.
5. Nine leaves, all distinct, and not one branch was abandoned part-way.
6. The call count is 13 — one root, three at depth one, nine at depth two — matching the prefix-product sum exactly.
7. The output is in lexicographic order for free, because the letters of each digit are already in order.

<!-- @example -->

<!-- @input -->
`digits = ""`, and `digits = "203"`

<!-- @output -->
`[]` in both cases — not `[""]`

<!-- @why -->
The most common wrong answer to this problem, and the one line that prevents it.

<!-- @walkthrough -->
1. With no digits there are no letters to choose, so there are zero combinations.
2. The tempting answer is `[""]`, which claims there is one — a combination made of no letters.
3. The recursion produces it by accident: with `i = 0` already equal to `digits.size()`, the base case fires and records the empty buffer.
4. The iterative form produces it more obviously still, since it is seeded with `[""]` and the loop over digits never runs.
5. So the guard has to sit before the recursion or before the seed, not inside it.
6. Digits `0` and `1` carry no letters, so their branching factor is zero and the product collapses: `"203"` yields **0** combinations, and the loop body simply never executes.
7. That case needs no special handling — an empty letter string makes the `for` loop do nothing, which is already the right answer.

<!-- @example -->

<!-- @input -->
Ten digits, all 2s, against ten digits all 7s

<!-- @output -->
59,049 combinations against **1,048,576** — a factor of 17.76

<!-- @why -->
The `O(3^n)` gloss is wrong on two of the eight keys, and the error compounds.

<!-- @walkthrough -->
1. Six keys carry three letters; `7` (`pqrs`) and `9` (`wxyz`) carry four.
2. The combination count is the product of the per-digit letter counts, not a power of three.
3. At k = 4 the all-four-letter input is 3.16x larger; at k = 8, 9.99x.
4. At k = 10 it is **17.76x** — 1,048,576 against 59,049.
5. The gap is `(4/3)^k`, so it has no ceiling; the honest bound is `O(k · 4^k)`.
6. That million-combination answer is 25.28 MB of output with `reserve`, and 49.39 MB without.
7. Sizing a buffer from the `3^n` estimate would under-allocate by a factor of nearly eighteen.

<!-- @example -->

<!-- @input -->
The same algorithm with the leaf-level calls removed

<!-- @output -->
4.00x fewer calls, 1.00x the speed in C++ and 1.70x in Python

<!-- @why -->
A node count is a proxy for cost only when the nodes do work.

<!-- @walkthrough -->
1. Emitting at the last digit instead of recursing deletes the entire bottom level of the tree.
2. On a ten-digit all-7s input that is 1,398,101 calls down to 349,525 — exactly 4.00x.
3. In C++ the running time went from 7,053µs to 7,096µs: no gain, and marginally worse.
4. The reason is that those calls were not wasting time — they were the calls performing `push_back`, and moving that up one level leaves the same number of writes.
5. **Generate Parentheses** measured the mirror-image rewrite at a steady 1.60x, because there the deleted calls built candidates that were immediately rejected.
6. In Python the same edit is worth **1.70x**, since an interpreted call carries a floor cost a compiled one does not — the identical split **Power Set** measured.
7. So "fewer nodes" and "faster" are different claims, and only the second one is worth optimising for.

<!-- @example -->

<!-- @input -->
Timing each level inside the full iterative build, then timing one level alone

<!-- @output -->
The in-build figures showed a jump at level 9; standalone, the cost is flat at 3.1–3.5ns per string

<!-- @why -->
A measurement that described the harness rather than the thing being measured.

<!-- @walkthrough -->
1. The iterative form is 1.07x slower than the recursion at k = 8 and 0.60x at k = 10, reproducibly.
2. Timing each level within one build appeared to explain it: ~5.5ns per string through level 8, dropping to 3.15ns at level 9.
3. That reading survived a 300ms full-clock warmup, ruling out CPU frequency ramping, and reproduced to three decimals across trials.
4. Building a single level standalone in its own process told a different story: **flat at 3.1–3.5ns per string** from 16,384 to 4,194,304 strings, fresh buffer or reused.
5. So there was no per-level discontinuity at all — the earlier levels of the same build were affecting the allocator and cache state of the ones timed after them.
6. The crossover between the two forms is real, but it lives in the memory system rather than in the algorithm: both do the same string constructions, and the recursion's own per-combination cost is flat at 6.7–7.0ns.
7. The general form is the one **Sort LL** hit from the other direction — a measurement can be perfectly repeatable and still be measuring the wrong thing.

<!-- @visualization recursion-tree -->

<!-- @description -->
Draw the tree for `"23"` as an actual tree and make its most important property visible by what is *absent*: no node greyed out, no branch cut, no back-arrow to a cached result. Root at the top holding an empty buffer, three edges labelled a, b, c, then three edges each labelled d, e, f, and nine leaves. Animate one depth-first pass with the buffer shown as a small box beside the walker — a letter sliding into the box on the way down and out of it on the way back up — because the push and the matching pop are the entire algorithm. Immediately beside it, put the same tree as it was drawn in the three preceding containers, so the contrast is on one screen: Combination Sum with 80.7% of its nodes crossed out as dead ends, Word Break with several distinct paths converging on one position and a memo arrow short-circuiting them, and this one with every node live and every leaf distinct. Second panel: branching. Draw the keypad with 7 and 9 lit differently from the rest, then two bars for a ten-digit input — 59,049 against 1,048,576 — with the smaller one barely visible against the larger, labelled 17.76x. Third panel is the cost split, and it should be drawn as an anatomy rather than a chart: the tree itself as a thin skeleton labelled 2,266.96µs, and hanging off its leaves the actual output — a million strings — labelled 7,440.50µs, so the reader sees that the answer outweighs the search 3.2 to 1. Inside one of those strings, zoom into the 24-byte string object and show the eight characters sitting *inside* it rather than behind a pointer, with the 22-character inline capacity marked and the note that reaching it would need 23 digits and 9.4e10 outputs. Fourth panel: two versions of the tree side by side, one with its bottom row of leaf-calls present and one with it deleted, the deleted one labelled 4.00x fewer calls, and beneath both the same running time — 7,053µs and 7,096µs — with C++ and Python columns showing 1.00x and 1.70x. That panel is the lesson: the arrow pointing at the smaller tree should not also point at a smaller number.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"keypad":{"2":"abc","3":"def","4":"ghi","5":"jkl","6":"mno","7":"pqrs","8":"tuv","9":"wxyz"},"treeShape":{"deadEnds":0,"duplicateOutputs":0,"note":"no guard to evaluate and no repeated states -- every node is on a path to an answer and every leaf is distinct, verified over 20 digit strings random and adversarial","leaves":"product of the per-digit letter counts","calls":"sum of the prefix products","verified":[{"digits":"23","combos":9,"calls":13},{"digits":"234","combos":27,"calls":40},{"digits":"7979","combos":256,"calls":341},{"digits":"23456789","combos":11664,"calls":15916},{"digits":"77777777","combos":65536,"calls":87381},{"digits":"7777777777","combos":1048576,"calls":1398101}],"nodesPerLeaf":1.3333,"contrast":{"combinationSum":"80.7% dead ends, needed a guard","combinationSumIII":"0% dead ends, but via a COMPLETE guard","wordBreak":"0 dead ends but repeated states, needed a memo","thisOne":"neither pathology -- nothing to refuse and nothing to remember"}},"branchingIsFour":{"note":"7 and 9 carry four letters; the usual O(3^n) gloss is wrong","ratio":"(4/3)^k","measured":[{"k":4,"three":81,"four":256,"ratio":3.16},{"k":7,"three":2187,"four":16384,"ratio":7.49},{"k":8,"three":6561,"four":65536,"ratio":9.99},{"k":10,"three":59049,"four":1048576,"ratio":17.76}],"honestBound":"O(k * 4^k)"},"materialisingVsTraversing":{"note":"each form in its own process, min of 300","cpp":[{"digits":"23456789","combos":11664,"traverse":26.79,"write":83.96,"ratio":3.13},{"digits":"77777777","combos":65536,"traverse":141.62,"write":451.08,"ratio":3.19},{"digits":"7777777777","combos":1048576,"traverse":2266.96,"write":7440.50,"ratio":3.28}],"recursionCostPerCombination":"flat at 6.7-7.0 ns from k=6 to k=10","comparedTo":"Power Set measured 15.8x for the same split; it is only 3.2x here because the output is k chars per leaf against 4/3 nodes per leaf"},"theSmallStringOptimisation":{"sizeofString":24,"inlineCapacity":22,"byValueVsByReference":{"77777777":{"buffer":451.08,"newStringPerEdge":618.96,"ratio":1.37},"7777777777":{"buffer":7440.50,"newStringPerEdge":7182.96,"ratio":0.97}},"contradicts":"Learn All Patterns of Subsequences measured carrying by value at 37.1x -- that figure does not transfer, because there the partial was a heap container and here it fits inside the string object","allocationsFor65536Combinations":{"buffer":17,"newStringPerEdge":17,"bufferPlusReserve":1,"note":"all of them are the output vector doubling; not one is a per-combination string allocation"},"unreachableByConstruction":"a combination longer than 22 chars needs 23 digits, i.e. at least 3^23 = 94,143,178,827 outputs"},"reserve":{"timeWin":1.06,"memoryWin":"exactly 2x","peakRSS":[{"k":8,"combos":65536,"noReserve":"4.31 MB","reserve":"2.78 MB","bytesPerCombo":[48.5,24.0]},{"k":9,"combos":262144,"noReserve":"13.38 MB","reserve":"7.30 MB","bytesPerCombo":[48.4,24.1]},{"k":10,"combos":1048576,"noReserve":"49.39 MB","reserve":"25.28 MB","bytesPerCombo":[48.1,24.0]}],"why":"24.0 bytes per combination is exactly one std::string object, confirming nothing else allocated; 2x without reserve because the final doubling holds both buffers at once","traversalPeakRSS":"1.28 MB baseline at every k"},"removingThreeQuartersOfTheCalls":{"rewrite":"emit at the last digit instead of recursing into a leaf call","calls":{"onEntry":1398101,"emitAtLast":349525,"ratio":4.000},"cpp":{"onEntry":7053,"emitAtLast":7096,"speedup":1.00,"note":"marginally SLOWER"},"python":{"onEntry":154.10,"emitAtLast":90.90,"speedup":1.70},"why":"the deleted calls were the ones writing the output, not wasting time -- moving the push_back up one level leaves the same number of writes","contrast":"Generate Parentheses measured the mirror-image rewrite at a steady 1.60x, because THERE the extra calls built candidates that were then rejected","sameSplitAs":"Power Set: 1.00x in C++, a real win in Python","lesson":"a node count is a proxy for cost only when the nodes do work"},"iterativeVsRecursive":{"cpp":[{"k":6,"recursion":27.83,"iterative":26.54,"ratio":0.95},{"k":8,"recursion":451.08,"iterative":483.12,"ratio":1.07},{"k":9,"recursion":1810.96,"iterative":1331.54,"ratio":0.735},{"k":10,"recursion":7440.50,"iterative":4481.79,"ratio":0.60}],"reproducibility":"to three decimals across trials, and unchanged after a 300ms full-clock warmup -- neither noise nor frequency ramping"},"aMeasurementThatLied":{"claim":"timing each level inside the full build showed ~5.5ns per string through level 8 dropping to 3.15ns at level 9","refutation":"building one level standalone in its own process is FLAT at 3.1-3.5 ns per string from 16,384 to 4,194,304 strings, fresh buffer or reused","whatWentWrong":"the per-level figures measured the preceding levels' effect on the allocator and caches, not the level itself","conclusion":"the crossover is real but lives in the memory system, not the algorithm -- both forms do the same string constructions and the recursion's per-combination cost is flat","relatedTo":"Sort LL hit the same class of error from the other direction: a measurement can be perfectly repeatable and still measure the wrong thing"},"pythonWantsTheOppositeCode":{"77777777":{"traverse":6.01,"listPlusJoin":10.16,"stringConcat":7.89,"comprehension":2.98,"itertoolsProduct":2.98},"7777777777":{"traverse":97.19,"listPlusJoin":174.69,"stringConcat":127.44,"comprehension":58.55,"itertoolsProduct":56.66},"concatBeatsBuffer":[1.29,1.37],"comprehensionBeatsRecursion":[3.41,2.98],"why":"append/pop/join is three interpreted operations where cur + ch is one, and the strings are far too short for the quadratic-concatenation argument","traversalShareOfTotal":{"python":"59%","cpp":"31%"},"consequence":"interpreted call overhead makes the traversal expensive and the string writing comparatively cheap, which is exactly why the call-removing rewrite pays in Python and not in C++"},"theEmptyInput":{"correct":"[]","commonWrongAnswer":"[\"\"]","whyItHappens":"with i == digits.size() at entry the base case fires and records the empty buffer; the iterative form is seeded with [\"\"] and its loop never runs","digitsZeroAndOne":"carry no letters, so the branching factor is zero and the product collapses -- \"203\" yields 0 combinations with no special handling, because an empty letter string makes the for loop do nothing"},"recursionDepth":{"exactly":"k, the number of digits","stackIsNeverAConcern":"reaching even 1,000 frames would need 1,000 digits and therefore at least 3^1000 combinations","contrastWith":"the Linked Lists topic, where recursion depth was one frame per node and measured a hard ceiling at 174,252 / 261,123 frames"},"recommendation":"one buffer pushed and popped, with the output reserved from the product of the letter counts; in Python write the comprehension instead","lesson":"with no guard and no repeated states, the only cost left is writing the answer -- and the received advice about recursion cost is aimed at the wrong things here"}
```

<!-- @highlights -->
- The tree for `"23"` is drawn as an actual tree, and its key property is what is absent — no greyed nodes, no cut branches, no memo arrows.
- One depth-first pass is animated with the buffer as a box beside the walker.
- A letter slides into the box on the way down and out on the way back up — the push and its matching pop are the whole algorithm.
- Beside it, the same tree from the three preceding containers, for contrast on one screen.
- Combination Sum with 80.7% of its nodes crossed out as dead ends.
- Word Break with several paths converging on one position and a memo arrow short-circuiting them.
- This one with every node live and every leaf distinct.
- Second panel: the keypad with 7 and 9 lit differently from the other six keys.
- Two bars for a ten-digit input — 59,049 against 1,048,576 — the smaller barely visible, labelled 17.76x.
- Third panel draws the cost split as an anatomy rather than a chart.
- The tree as a thin skeleton labelled 2,266.96µs, with the output hanging off its leaves labelled 7,440.50µs.
- The answer outweighs the search 3.2 to 1, and that is the point of the drawing.
- Zoom into one 24-byte string object and show the characters sitting inside it rather than behind a pointer.
- The 22-character inline capacity is marked, with the note that reaching it needs 23 digits and 9.4e10 outputs.
- Fourth panel: the tree with its bottom row of leaf-calls present, and the same tree with that row deleted.
- The deleted one is labelled 4.00x fewer calls, and beneath both sit 7,053µs and 7,096µs.
- C++ and Python columns show 1.00x and 1.70x for the same edit.
- The arrow pointing at the smaller tree must not also point at a smaller number — that is the panel's whole reason to exist.

<!-- @edgeCases -->
- The empty digit string — zero combinations, and the answer is `[]`, never `[""]`.
- A single digit — three combinations, or four for `7` and `9`.
- Digits `0` and `1` — no letters, so the product collapses to zero combinations and the loop body never runs.
- A digit string containing only `0` and `1` — same result, and it needs no separate branch.
- All 7s and 9s — the true worst case, `4^k` rather than `3^k`, and 17.76x larger at ten digits.
- Ten digits of 7s — 1,048,576 combinations and 25.28 MB of output with `reserve`, 49.39 MB without.
- A long digit string — the output, not the stack, is what fails first; the depth is only `k`.
- The buffer after a completed branch — restored by the `pop_back`, and silently wrong without it.
- The iterative form's `[""]` seed — correct for every input except the empty one, which is the one it gets wrong.
- The "emit at the last digit" variant — has no base case, so an empty input indexes past the end rather than returning nothing.
- Combinations longer than 22 characters — unreachable, since they would need 23 digits and at least 3^23 outputs.

<!-- @pitfalls -->
- Returning `[""]` for an empty input. One combination of no letters is not zero combinations, and this is the most common wrong answer to the problem.
- Putting the empty-input guard after the `[""]` seed in the iterative form. The ordering is the whole fix.
- Quoting the complexity as `O(3^n)`. Two of the eight keys carry four letters, and `(4/3)^k` reaches 17.76x by ten digits.
- Sizing a buffer from `3^n`. It under-allocates by nearly eighteen at k = 10.
- Forgetting the `pop_back` after the recursive call. The buffer accumulates every letter it has ever held.
- Assuming carrying the partial by value is the expensive mistake it was in **Learn All Patterns**. Here it is 1.37x, and 0.97x at a million combinations, because the string never leaves its own object.
- Skipping `reserve` because it only buys 1.06x in time. It buys exactly 2x in peak memory — 49.39 MB against 25.28 MB.
- Rewriting to remove the leaf-level calls and expecting a speedup in C++. It is 4.00x fewer calls and 1.00x the time.
- Porting the C++ buffer-and-join idiom into Python. Plain concatenation measured 1.29x faster there, and a comprehension 3.41x.
- Writing the recursion in Python at all when a comprehension or `itertools.product` will do. Both are 3x quicker and run the same loop in C.
- Timing a stage inside a composite build. The per-level figures here were repeatable, survived a warmup, and still described the harness rather than the stage.
- Worrying about the recursion depth. It is exactly `k`, and 1,000 frames would require 3^1000 combinations.

<!-- @doubt -->
### Is it 3^n or 4^n?

<!-- @answer -->
Neither, exactly — it is the **product of the per-digit letter counts**, and the honest upper bound is `O(k · 4^k)`. Six keys carry three letters, but `7` (`pqrs`) and `9` (`wxyz`) carry four, so any input containing them is larger than `3^k`. The gap is `(4/3)^k` and it compounds: 3.16x at four digits, 9.99x at eight, and **17.76x** at ten, where an all-7s input produces **1,048,576** combinations against 59,049. That is the difference between a 25 MB answer and a 1.4 MB one. The `k` factor in front matters too — each combination is `k` characters long, so writing the output is `k · 4^k` character-writes, not `4^k`. If you are sizing a buffer or predicting whether an input is feasible, use the product; it is one loop and it is exact.

<!-- @doubt -->
### Why is `[""]` wrong for an empty input?

<!-- @answer -->
Because `[""]` claims there is **one** combination — the one made of no letters — and the correct answer is that there are **zero**. It is not a pedantic distinction: the count is the product of the per-digit letter counts, and an empty product is 1, which is exactly the trap. Both forms fall into it by accident. The recursion enters with `i` already equal to `digits.size()`, so the base case fires immediately and records the empty buffer. The iterative form is seeded with `[""]` and then never runs its loop, returning the seed untouched — which is why the guard has to come *before* the seed, not after it. Related and easier: digits `0` and `1` carry no letters, so their branching factor is zero and the product genuinely collapses — `"203"` yields 0 combinations with no special handling at all, because looping over an empty letter string does nothing.

<!-- @doubt -->
### Do I need to worry about the recursion depth?

<!-- @answer -->
No, and the reason is worth stating precisely: the depth is exactly `k`, the number of digits, and `k` cannot get large because `4^k` gets large first. To reach even a thousand stack frames you would need a thousand digits, and therefore at least `3^1000` combinations — an answer that cannot be written down, let alone held. The binding constraint is always the output. This is the opposite situation from the **Linked Lists** topic, where the recursion held one frame per node and the stack ceiling was measured at 174,252 frames unoptimised and 261,123 optimised; there the depth grew with the input and the stack was the thing that broke. Here, at a million combinations, the stack is ten frames deep and the output is 25.28 MB.

<!-- @doubt -->
### This topic said passing the partial by value costs 37.1x. Why is it 1.37x here?

<!-- @answer -->
Because the two measurements are of different things, and the difference is the **small-string optimisation**. **Learn All Patterns of Subsequences** measured a partial that was a heap-backed container, so copying it meant an allocation and an element-by-element copy — hence 37.1x. Here the partial is a `std::string` of at most a few characters. `sizeof(std::string)` is 24 bytes and its inline capacity is **22 characters**, so the letters are stored *inside* the string object rather than behind a pointer, and copying it is a fixed 24-byte copy with no allocation. Measured directly by counting every call to global `operator new` while generating 65,536 combinations: **17 allocations**, and the by-value form makes exactly the same 17 — all of them the output vector doubling, none of them a string. The result is 1.37x at 65,536 combinations and **0.97x** at a million, where the by-value form is not slower at all. And the inline path can never be escaped here: a combination longer than 22 characters needs 23 digits, which needs at least 3^23 = 94 billion outputs. Write the buffer version anyway — it is the habit that transfers to problems where the partial *is* a container — but know that here it is a small effect, not the difference between working and not.

<!-- @doubt -->
### I removed three-quarters of the recursive calls and it got no faster. Why?

<!-- @answer -->
Because those calls were doing the work, not wasting it. Emitting at the last digit rather than recursing into a leaf call removes the entire bottom level of the tree — **exactly 4.00x** fewer calls, 349,525 against 1,398,101 on a ten-digit all-7s input — but every one of the calls you deleted was performing a `push_back` into the output, and moving that up one level leaves the same number of string writes. Measured, C++ went from 7,053µs to **7,096µs**: marginally *slower*. It is a genuine win in Python, at **1.70x**, because an interpreted call carries a cost floor a compiled one does not — the same split **Power Set** measured for relocating its branching, 1.00x in C++ and a real gain in Python. Compare **Generate Parentheses**, where the mirror-image rewrite was worth a steady 1.60x: there the extra calls constructed candidates that were then rejected, so deleting them deleted real waste. The general rule this leaves you with is that **a node count is a proxy for cost only when the nodes do work** — and in this problem every node does.

<!-- @doubt -->
### Does `reserve` on the output actually matter?

<!-- @answer -->
For speed, barely — a steady **1.06x**. For memory, it is exactly **2x**, and that is the reason to write it. Peak RSS at a million combinations was **49.39 MB** without it and **25.28 MB** with, which works out to 48.1 bytes per combination against 24.0. The 24.0 is exactly one `std::string` object, which independently confirms that nothing else was ever allocated; the 48.1 is that doubled, because a growing vector's final reallocation holds the old buffer and the new one at the same instant. What makes it inexcusable to skip here is that you can compute the answer's exact size before the search starts — it is the product of the per-digit letter counts, one loop over the input — so this is not a guess or a heuristic but the precise number. Java's `new ArrayList<>(n)` and Python's list preallocation are the same idea, though Python's list growth is already amortised gently enough that it matters less there.

<!-- @doubt -->
### Should I write the iterative version instead?

<!-- @answer -->
In C++ it is a genuine option and at large inputs the better one: measured within 7% of the recursion up to k = 8, then **1.66x faster** at k = 10 — 4,481.79µs against 7,440.50µs. It also uses no stack at all, though as noted the stack was never the constraint. Its cost is holding two adjacent levels at once rather than one small buffer, so its peak memory is higher. Be careful about *why* it is faster: timing each level inside the build suggested a per-level effect, and that turned out to be an artefact — building one level standalone is flat at 3.1–3.5ns per string across every size tested, so the crossover lives in the memory system rather than in either algorithm. In **Python** the answer is much less equivocal: write the comprehension. `out = [s + c for s in out for c in LET[d]]` measured **3.41x** faster than the recursion, and matches `itertools.product` because they are the same C loop. The recursion is worth writing in Python only when the interviewer asked for recursion.

<!-- @doubt -->
### Why does Python want different code from C++?

<!-- @answer -->
Because the two languages price the same operations differently, and this problem is small enough for that to dominate. Three inversions were measured. First, the buffer idiom loses: `"".join(cur)` plus the matching `append` and `pop` is three interpreted operations where `cur + ch` is one, so plain concatenation ran **1.29x** faster at 65,536 combinations and **1.37x** at a million — the exact opposite of the C++ result. The usual objection, that repeated concatenation is quadratic, does not apply because the strings are at most a handful of characters. Second, the recursion itself loses to a comprehension by **3.0–3.4x**. Third, and underneath both, the balance of costs is different: the bare tree walk is **59%** of Python's total against **31%** of C++'s, so in Python the calls are expensive and the string writes are comparatively cheap. That single fact explains why removing the leaf-level calls is worth 1.70x in Python and 1.00x in C++.

<!-- @doubt -->
### How is this a Hard problem if the recursion is four lines?

<!-- @answer -->
It is placed here as the opening of the Hard set rather than because the recursion is difficult, and the placement is deliberate. Every problem in the medium set had a pathology to fix: Combination Sum had **80.7%** dead ends and needed a guard, Combination Sum III needed a complete one, Word Break had no dead ends but repeated states and needed a memo. This tree has **neither** — measured over twenty digit strings, zero dead ends and zero duplicate outputs, so there is nothing to refuse and nothing to remember. That makes it the clean baseline: with the search itself costing nothing to steer, what is left is the cost of writing the answer down, which is 3.2x the traversal and is where all the measurable behaviour in this container lives. **Palindrome Partitioning** brings the guard back immediately, and with it a cost the earlier problems did not have — a branch test that is no longer free — so having one container where every node reached is a node that pays is what makes that comparison legible.
