---
id: word-break
topic: Advanced Recursion
title: Word Break
difficulty: Medium
status: ready
prerequisites:
  - combination-sum-iii
  - combination-sum
  - power-set
  - fibonacci-number
  - time-and-space-complexity-basics
relatedIds:
  - combination-sum-iii
  - fibonacci-number
  - generate-binary-strings-without-consecutive-1s
  - power-set
---

<!-- @summary -->
The first problem in this topic where the exponential tree is not full of branches that cannot finish, but of branches already computed — so the fix is memoisation rather than pruning. There are exactly n + 1 distinct states however large the tree gets, verified at n = 5000, and collapsing onto them takes 8,146,016 calls down to 91 at n = 24. Two things the usual account leaves out: the un-memoised growth base is exactly a k-bonacci constant, phi for a dictionary of lengths 1–2 and 1.9276 for 1–4; and top-down beats bottom-up by 0.63x on a satisfiable instance and loses by 1.12x on an unsatisfiable one, because only top-down can stop early.

<!-- @theory -->
## The problem

Given a string `s` and a dictionary, decide whether `s` can be cut into a
sequence of dictionary words.

```
s = "applepenapple", dict = {"apple", "pen"}   ->  true
s = "catsandog",     dict = {"cats","dog","sand","and","cat"}  ->  false
```

The recursion is short: at position `i`, try every dictionary word that matches
there and recurse past it. What is new is the shape of the tree it makes.

## The tree is full of repeats, not dead ends

Every previous subtopic here was about *pruning* — refusing branches that could
not lead to an answer. Combination Sum measured 80.7% of its nodes as dead ends;
Combination Sum III got that to 0% with a complete guard.

This tree is not like that. Position 7 might be reachable from position 0 via
`3+4`, via `4+3`, via `2+2+3`, and so on — and every one of those arrivals asks
the identical question: *can the rest of the string be broken?* The work is
duplicated, not wasted. No guard can help, because nothing is illegal; the
branches are all legitimate and all asking the same thing.

## Exactly n + 1 distinct states

The answer depends only on `i`. That is the whole observation, and it bounds the
problem immediately: there are `n + 1` positions, so at most `n + 1` distinct
questions exist however large the tree is.

On the adversarial case — `s = "a"*n + "b"` with dictionary
`{a, aa, aaa, aaaa}`, which has no segmentation and therefore forces the full
search:

| n | plain calls | memoised calls | memo entries | ratio |
|---|---|---|---|---|
| 12 | 3,096 | 43 | 13 | 72.0x |
| 16 | 42,744 | 59 | 17 | 724.5x |
| 20 | 590,081 | 75 | 21 | 7,867.7x |
| 24 | **8,146,016** | **91** | 25 | **89,516.7x** |

The memo-entry column is `n + 1` in every row, and stays there: at n = 100 it is
101, at n = 1000 it is 1001, at n = 5000 it is 5001. The call column grows
linearly too — `4n − 5` for a four-word dictionary, since each of the n + 1
states is expanded once and tries at most four words.

## The growth base is a k-bonacci constant

The un-memoised count is not vaguely exponential; its base is exact and
familiar. With a dictionary containing every length from 1 to L, the call count
satisfies the L-step Fibonacci recurrence, so the growth per extra character
converges to the L-bonacci constant:

| dictionary lengths | measured growth | constant |
|---|---|---|
| 1–2 | 1.6180 | phi |
| 1–3 | 1.8393 | tribonacci |
| 1–4 | 1.9276 | tetranacci |

Phi appears here for the third time in this topic, and in a different role each
time. Fibonacci Number measured it as the cost of a wasteful recursion; Generate
Binary Strings measured it as the growth of an *answer* count; here it is the
growth of duplicated work, and memoisation removes it outright.

## Top-down or bottom-up: it depends on the answer

Both compute the same n + 1 states, so the usual advice is that they are
equivalent up to stack overhead. Measured, they are not — and which one wins
flips with the answer.

C++, `|s| = 20,003`, a 1,603-word dictionary, min of 200 with each form measured
twice in opposite order:

| | satisfiable | unsatisfiable |
|---|---|---|
| memoised recursion | **727.8µs** | 5,227.6µs |
| bottom-up DP | 1,151.0µs | **4,688.2µs** |
| memo / bottom-up | **0.63x** | **1.12x** |

The reason is that top-down computes only the states it needs. On a satisfiable
instance it returns the moment a segmentation is found — measured, it expanded
10,003 calls over 20,004 states, roughly half — while bottom-up fills every cell
unconditionally. On an unsatisfiable instance there is no early exit, every
state must be settled either way, and the recursion pays call overhead for
nothing.

Python agrees and amplifies it: 0.84x satisfiable, 1.52x unsatisfiable.

So bottom-up is the safer default and top-down is faster on the common case,
which is a more useful statement than "they are the same".

## The cost is the substring, not the DP

With the states settled, what remains is the dictionary lookup. The obvious
version builds a substring for every (position, length) pair and hashes it —
`n × maxlen` allocations. A trie walks each position once instead, never
constructing anything:

| | C++ satisfiable | C++ unsatisfiable | Python satisfiable | Python unsatisfiable |
|---|---|---|---|---|
| memoised recursion | 727.8µs | 5,227.6µs | 6.20ms | 32.92ms |
| bottom-up DP | 1,151.0µs | 4,688.2µs | 7.36ms | 21.64ms |
| **trie-driven DP** | **55.0µs** | **664.9µs** | 6.38ms | 11.42ms |

In C++ that is **13.17x** and **8.20x** — the substring construction was
dominating everything, and the DP itself was never the cost. In Python the trie
is roughly break-even on the satisfiable case and only 1.9x on the hard one,
because there the comparison inverts: `s[i:i+L] in d` runs entirely in C while
the trie walk runs one interpreted dict lookup per character. Same series-long
pattern, one more time — the win is real where the removed operation was the
expensive one.

## Deciding is linear; enumerating is not

Memoisation makes the *decision* problem linear in the number of states. It
cannot do the same for the *enumeration* problem — listing every segmentation —
because the output itself is exponential:

| n | segmentations of `"a"*n` with `{a, aa, aaa, aaaa}` |
|---|---|
| 12 | 1,490 |
| 20 | 283,953 |
| 24 | 3,919,944 |
| 30 | **201,061,985** |

The same memo still helps, by sharing suffix results across the many prefixes
that reach a position — but no amount of sharing makes an exponential answer
polynomial to write down. That distinction is worth holding on to, because
"add memoisation" is offered as a fix for both and only ever fixes one.

## The arc

| recursion | what the tree is full of | the fix |
|---|---|---|
| power set, subsets I and II | nothing wasted | — |
| no adjacent 1s, parentheses | nothing wasted (perfect guards) | — |
| combination sum | 80.7% dead ends | a complete guard, or a reachability table |
| combination sum II | 67.6% dead ends | same |
| combination sum III | 0% — the guard is complete | the size constraint |
| **word break** | **duplicates, not dead ends** | **memoisation** |

Every earlier problem asked *can this branch finish*. This one asks *have I
already answered this*. They are different questions and they need different
machinery, which is the reason to end the medium set here.

## Where this goes next

The **Hard** set opens with **Letter Combinations of a Phone Number**, which
returns to plain enumeration — no guard, no repeats, one branch per letter on
each digit — and is the cleanest possible reset before N-Queens, Sudoku and Word
Search, where the guard comes back and gets considerably more expensive to
evaluate than anything measured so far.

<!-- @intuition -->
The recursion is the shortest in this topic — at position i, try each dictionary word that matches and recurse past it — but the tree it makes is a different shape from everything before. Every earlier problem here had branches that could not lead to an answer, and the work was refusing them early. Nothing is illegal in this one. Position 7 can be reached by many different splits, every one of them legitimate, and every one asking exactly the same question: can the rest of the string be broken? So the tree is full of duplicated work rather than wasted work, and a guard has nothing to refuse. What collapses it is noticing that the answer depends only on the position, which means there are only n + 1 distinct questions no matter how large the tree grows. The rest of the file is about what happens once that is done: whether to compute the states top-down or bottom-up turns out to depend on whether the answer is yes, and the remaining cost turns out to be the substring hashing rather than the recursion at all.

<!-- @approach -->
### Plain Recursion

<!-- @idea -->
At each position, try every dictionary word that matches there and recurse past it.

<!-- @steps -->
1. Carry the current position in the string.
2. If the position is the end, the string has been fully consumed — return true.
3. Otherwise loop over the dictionary.
4. When a word matches at this position, recurse from just past it.
5. Return true on the first success, and false if no word leads anywhere.

<!-- @complexity -->
- time: exponential, with base the k-bonacci constant of the dictionary's word lengths
- space: O(n) call stack
- note: The growth base is exact rather than approximate — measured 1.6180 for lengths 1–2, 1.8393 for 1–3 and 1.9276 for 1–4, which are phi and the tribonacci and tetranacci constants. On the adversarial `"a"*n + "b"` it makes 8,146,016 calls at n = 24 where the memoised version makes 91, a factor of 89,516.7. Correct, and useful only as the baseline that shows what the memo is worth.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

bool wordBreak(const string& s, const vector<string>& words, int i = 0) {
    if (i == (int)s.size()) return true;
    for (const string& w : words)
        if (s.compare(i, w.size(), w) == 0 && wordBreak(s, words, i + w.size()))
            return true;
    return false;
}
```

<!-- @annotations -->
- 6: The base case is reaching the end, not running out of words — the recursion is driven by the position, which is the fact the memoised version exploits.
- 8: compare with a length avoids building a substring, so this version's cost is genuinely the branching rather than allocation. That matters when comparing it against the memoised version below.
- 9: Returning on the first success means a satisfiable instance can finish early, which is the property bottom-up DP gives up.

<!-- @code java -->
```java
static boolean wordBreak(String s, List<String> words, int i) {
    if (i == s.length()) return true;
    for (String w : words)
        if (s.startsWith(w, i) && wordBreak(s, words, i + w.length()))
            return true;
    return false;
}
```

<!-- @annotations -->
- 4: startsWith(w, i) tests at an offset without copying, which is the Java equivalent of comparing in place.
- 5: The recursion advances by the matched word's length, so the position is the only state that changes — n + 1 possible values, which is the whole basis for memoising it.

<!-- @code python -->
```python
def word_break(s, words):
    def go(i):
        if i == len(s):
            return True
        for w in words:
            if s.startswith(w, i) and go(i + len(w)):
                return True
        return False

    return go(0)


# 8,146,016 calls on "a"*24 + "b" with {a, aa, aaa, aaaa}, against 91
# for the memoised version — 89,516.7x, and growing by 1.9276 per char.
```

<!-- @annotations -->
- 6: s.startswith(w, i) checks at an offset without slicing, so no substring is built here either — the exponential blowup is entirely the repeated recursion.

<!-- @approach -->
### Memoised Recursion

<!-- @idea -->
The answer depends only on the position, so record it the first time and return it thereafter.

<!-- @steps -->
1. Keep a table indexed by position, initially all unknown.
2. On entering a position, return the stored answer if there is one.
3. Otherwise mark it false before recursing, so a revisit during the computation returns rather than looping.
4. Try each word length up to the longest in the dictionary, testing whether that slice is a word.
5. Store and return the result, so every position is computed exactly once.

<!-- @complexity -->
- time: O(n · maxlen) lookups after the collapse, since each of the n + 1 states is expanded once
- space: O(n) for the memo plus O(n) call stack
- note: The memo holds exactly n + 1 entries however large the tree would have been — verified as 101, 1001 and 5001 at n = 100, 1000 and 5000. Call count is linear too, 4n − 5 for a four-word dictionary. Measured 727.8µs on a satisfiable 20,003-character instance against bottom-up DP's 1,151.0µs — **0.63x**, because it stops as soon as a segmentation is found and expanded only 10,003 of the 20,004 states. On an unsatisfiable instance the advantage reverses to 1.12x.

<!-- @code cpp -->
```cpp
bool wordBreak(const string& s, const unordered_set<string>& dict) {
    int n = s.size(), maxlen = 0;
    for (const string& w : dict) maxlen = max(maxlen, (int)w.size());
    vector<char> memo(n, -1);

    function<bool(int)> go = [&](int i) {
        if (i == n) return true;
        if (memo[i] != -1) return (bool)memo[i];
        memo[i] = 0;
        for (int L = 1; L <= maxlen && i + L <= n; L++)
            if (dict.count(s.substr(i, L)) && go(i + L)) { memo[i] = 1; break; }
        return (bool)memo[i];
    };
    return go(0);
}
```

<!-- @annotations -->
- 4: One entry per position, and that is the entire state space — n + 1 counting the end, which needs no cell because it is answered by the base case.
- 10: Writing false before recursing is what makes a cycle impossible. It cannot actually happen here, since every recursive call strictly increases i, but the habit matters the moment a problem allows zero-length moves.
- 12: substr allocates. This is the line the trie version exists to remove, and in C++ it turns out to dominate everything else by more than 13x.

<!-- @code java -->
```java
static Boolean[] memo;

static boolean wordBreak(String s, Set<String> dict, int i, int maxlen) {
    if (i == s.length()) return true;
    if (memo[i] != null) return memo[i];
    memo[i] = false;
    for (int L = 1; L <= maxlen && i + L <= s.length(); L++)
        if (dict.contains(s.substring(i, i + L)) && wordBreak(s, dict, i + L, maxlen)) {
            memo[i] = true;
            break;
        }
    return memo[i];
}
```

<!-- @annotations -->
- 5: Boolean rather than boolean, so null distinguishes not-yet-computed from computed-false. A boolean[] cannot express three states and would recompute every false position on each visit, which quietly restores the exponential behaviour.
- 8: substring copies in Java as it does in C++, so this version pays the same allocation cost the trie removes.

<!-- @code python -->
```python
def word_break(s, words):
    d = set(words)
    maxl = max(map(len, words))
    memo = {}

    def go(i):
        if i == len(s):
            return True
        if i in memo:
            return memo[i]
        memo[i] = False
        for L in range(1, maxl + 1):
            if i + L <= len(s) and s[i:i + L] in d and go(i + L):
                memo[i] = True
                break
        return memo[i]

    return go(0)


# 6.20ms on a satisfiable 20,003-character instance against bottom-up's
# 7.36ms — 0.84x. On an unsatisfiable one it reverses to 1.52x.
```

<!-- @annotations -->
- 11: memo[i] = False before recursing, so the dictionary doubles as the visited set. Using a plain dict rather than lru_cache keeps that in-progress marking visible.
- 13: The slice is built and hashed here. In Python this runs entirely in C, which is why the trie version — an interpreted dict lookup per character — barely wins at all.

<!-- @approach -->
### Bottom-Up DP

<!-- @idea -->
Fill the same table of positions directly, from the end of the string backwards, with no recursion.

<!-- @steps -->
1. Allocate a table of n + 1 booleans and set the last to true — the empty suffix is always breakable.
2. Walk i from n − 1 down to 0.
3. For each word length up to the longest in the dictionary, check whether the slice starting at i is a word.
4. If it is, and the position after it is already marked true, mark i true and stop.
5. The answer is the entry for position 0.

<!-- @complexity -->
- time: Θ(n · maxlen), with no early exit
- space: O(n) for the table, no call stack
- note: Computes every state whether or not it is needed, which makes it slower than the memoised recursion on a satisfiable instance — 1,151.0µs against 727.8µs, a factor of 1.59 — and faster on an unsatisfiable one, 4,688.2µs against 5,227.6µs. Python shows the same reversal, 0.84x and 1.52x. It is the safer default because it has no stack to overflow and no worst case relative to itself, but it is not free of a trade.

<!-- @code cpp -->
```cpp
bool wordBreak(const string& s, const unordered_set<string>& dict) {
    int n = s.size(), maxlen = 0;
    for (const string& w : dict) maxlen = max(maxlen, (int)w.size());
    vector<char> dp(n + 1, 0);
    dp[n] = 1;
    for (int i = n - 1; i >= 0; i--)
        for (int L = 1; L <= maxlen && i + L <= n; L++)
            if (dict.count(s.substr(i, L)) && dp[i + L]) { dp[i] = 1; break; }
    return dp[0];
}
```

<!-- @annotations -->
- 5: The empty suffix is breakable, which is the base case the recursion expressed as i == n. Getting this wrong makes the whole table false.
- 6: Iterating backwards means dp[i + L] is always already computed — the dependency runs from later positions to earlier ones, which is the same direction the recursion descends.
- 8: No early exit exists here. Every cell is filled even when dp[0] was decidable from the first few, which is exactly what costs 1.59x against the recursion on a satisfiable instance.

<!-- @code java -->
```java
static boolean wordBreak(String s, Set<String> dict) {
    int n = s.length(), maxlen = 0;
    for (String w : dict) maxlen = Math.max(maxlen, w.length());
    boolean[] dp = new boolean[n + 1];
    dp[n] = true;
    for (int i = n - 1; i >= 0; i--)
        for (int L = 1; L <= maxlen && i + L <= n; L++)
            if (dict.contains(s.substring(i, i + L)) && dp[i + L]) { dp[i] = true; break; }
    return dp[0];
}
```

<!-- @annotations -->
- 4: boolean[] is enough here, unlike the memoised version — there is no not-yet-computed state to represent, because the loop order guarantees dependencies are already filled.
- 7: Capping L at maxlen is what keeps this Θ(n · maxlen) rather than Θ(n²). Without it every suffix length is tried at every position.

<!-- @code python -->
```python
def word_break(s, words):
    d = set(words)
    maxl = max(map(len, words))
    n = len(s)
    dp = [False] * (n + 1)
    dp[n] = True
    for i in range(n - 1, -1, -1):
        for L in range(1, maxl + 1):
            if i + L <= n and s[i:i + L] in d and dp[i + L]:
                dp[i] = True
                break
    return dp[0]


# 7.36ms satisfiable, 21.64ms unsatisfiable. The recursion is 0.84x on
# the first and 1.52x on the second — the flip is the early exit.
```

<!-- @annotations -->
- 6: dp[n] = True is the empty suffix. Every other entry is derived from it, so a False here makes the answer False for any input.
- 8: Bounding L by maxl rather than by n is the difference between Θ(n · maxlen) and Θ(n²); with a 20,000-character string and words of length at most 7, that is a factor of nearly 3,000.

<!-- @approach -->
### Trie-Driven DP

<!-- @idea -->
Walk a trie of the dictionary from each position, so no substring is ever constructed or hashed.

<!-- @steps -->
1. Insert every dictionary word into a trie, marking the node at each word's end.
2. Allocate the same table of n + 1 booleans with the last set to true.
3. Walk i from n − 1 down to 0, starting a fresh trie descent at the root.
4. Step forward one character at a time, stopping as soon as the trie has no such edge.
5. Whenever the current node ends a word and the position after it is true, mark i true and stop.

<!-- @complexity -->
- time: Θ(n · maxlen) character steps, with no allocation
- space: O(total dictionary characters) for the trie, plus O(n) for the table
- note: The DP was never the cost — the substring construction was. Measured 55.0µs against the memoised recursion's 727.8µs in C++, **13.17x**, and 664.9µs against 5,227.6µs on the unsatisfiable instance, 8.20x. Python inverts it: 6.38ms against 6.20ms satisfiable, roughly break-even, because `s[i:i+L] in d` runs in C while a trie walk is one interpreted dict lookup per character. The trie also stops early on a dead prefix, where the hashing version keeps trying longer slices.

<!-- @code cpp -->
```cpp
struct Node {
    int next[26];
    bool end;
    Node() { fill(next, next + 26, -1); end = false; }
};

bool wordBreak(const string& s, const vector<string>& words) {
    vector<Node> trie(1);
    for (const string& w : words) {
        int c = 0;
        for (char ch : w) {
            int x = ch - 'a';
            if (trie[c].next[x] < 0) { trie[c].next[x] = trie.size(); trie.push_back(Node()); }
            c = trie[c].next[x];
        }
        trie[c].end = true;
    }
    int n = s.size();
    vector<char> dp(n + 1, 0);
    dp[n] = 1;
    for (int i = n - 1; i >= 0; i--) {
        int c = 0;
        for (int j = i; j < n; j++) {
            int x = s[j] - 'a';
            if (trie[c].next[x] < 0) break;
            c = trie[c].next[x];
            if (trie[c].end && dp[j + 1]) { dp[i] = 1; break; }
        }
    }
    return dp[0];
}
```

<!-- @annotations -->
- 13: Recording the index rather than a pointer, because trie.push_back may reallocate the vector and invalidate every pointer into it. This is the bug that makes a node-pointer trie work in testing and fail on a large dictionary.
- 24: The descent stops the moment no edge matches, so a position whose prefix is not in the dictionary at all costs one character rather than maxlen slices.
- 26: Nothing is constructed anywhere in this loop — no substring, no hash. That absence is the entire 13.17x against the hashing version.

<!-- @code java -->
```java
static boolean wordBreak(String s, List<String> words) {
    Object[] root = new Object[27];          // 0..25 children, 26 = end marker
    for (String w : words) {
        Object[] node = root;
        for (char ch : w.toCharArray()) {
            int x = ch - 'a';
            if (node[x] == null) node[x] = new Object[27];
            node = (Object[]) node[x];
        }
        node[26] = Boolean.TRUE;
    }
    int n = s.length();
    boolean[] dp = new boolean[n + 1];
    dp[n] = true;
    for (int i = n - 1; i >= 0; i--) {
        Object[] node = root;
        for (int j = i; j < n; j++) {
            int x = s.charAt(j) - 'a';
            if (node[x] == null) break;
            node = (Object[]) node[x];
            if (node[26] != null && dp[j + 1]) { dp[i] = true; break; }
        }
    }
    return dp[0];
}
```

<!-- @annotations -->
- 2: An Object[] of 27 slots with the last as the end marker keeps the whole trie in one array type. A dedicated Node class is clearer in real code; this form is here to stay close to the C++ layout.
- 18: charAt rather than substring, which is the point of the whole approach — no String is created anywhere in the scan.

<!-- @code python -->
```python
def word_break(s, words):
    root = {}
    for w in words:
        node = root
        for ch in w:
            node = node.setdefault(ch, {})
        node["$"] = True

    n = len(s)
    dp = [False] * (n + 1)
    dp[n] = True
    for i in range(n - 1, -1, -1):
        node = root
        for j in range(i, n):
            node = node.get(s[j])
            if node is None:
                break
            if "$" in node and dp[j + 1]:
                dp[i] = True
                break
    return dp[0]


# 6.38ms satisfiable against the hashing DP's 7.36ms — barely a win,
# where C++ measured 13.17x. Slicing runs in C; the trie walk does not.
```

<!-- @annotations -->
- 6: "$" as the end marker works because it cannot collide with a character of the alphabet. A sentinel that could appear in a word would make that word's prefix look terminal.
- 15: One interpreted dict lookup per character. This is exactly the work C++ does in a single array index, which is why the same idea is transformative there and marginal here.

<!-- @example -->

<!-- @input -->
s = "applepenapple", dict = {"apple", "pen"}

<!-- @output -->
true

<!-- @why -->
The canonical satisfiable case, and the smallest one where a position is reached more than once.

<!-- @walkthrough -->
1. From position 0, "apple" matches and the recursion moves to position 5.
2. From 5, "pen" matches and it moves to position 8.
3. From 8, "apple" matches and it reaches position 13, which is the end — true.
4. Unwinding, every call returns true immediately and no other branch is tried.
5. The memo holds entries for positions 0, 5 and 8 only, because those are the only ones reached.
6. Bottom-up DP would fill all fourteen cells regardless, which is the extra work the early exit avoids.
7. On this input the difference is invisible; at 20,003 characters it measured 727.8µs against 1,151.0µs.

<!-- @example -->

<!-- @input -->
s = "catsandog", dict = {"cats","dog","sand","and","cat"}

<!-- @output -->
false

<!-- @why -->
The canonical unsatisfiable case, where position 7 is reached by two different routes asking the same question.

<!-- @walkthrough -->
1. "cats" matches at 0, taking the recursion to position 4; from there "and" reaches position 7.
2. From 7 the remaining text is "og", which no word matches, so that branch fails.
3. Backtracking, "cat" also matches at 0, taking the recursion to position 3; from there "sand" reaches position 7 again.
4. Position 7 is asked the identical question a second time, and without a memo it is recomputed from scratch.
5. With a memo the second arrival returns the stored false immediately.
6. This is the shape the whole file is about — the branch was not illegal and no guard could have refused it, it had simply already been answered.
7. The answer is false, and both routes had to be explored to establish it.

<!-- @example -->

<!-- @input -->
s = "a"*24 + "b", dict = {"a","aa","aaa","aaaa"}

<!-- @output -->
false, from 8,146,016 calls or from 91

<!-- @why -->
The adversarial case that forces the full search, and where the collapse onto n + 1 states is at its most visible.

<!-- @walkthrough -->
1. Every prefix of a-characters can be cut in many ways, and none of them ever consumes the final "b".
2. So every branch must be explored in full before false can be returned.
3. Un-memoised that is 8,146,016 calls, and the count grows by a factor of 1.9276 per additional character — the tetranacci constant, because the dictionary has lengths 1 through 4.
4. Memoised it is 91 calls over 25 stored positions, which is n + 1.
5. The ratio is 89,516.7x here and doubles roughly every character beyond it.
6. Nothing was pruned — every one of those 8 million calls was a legal branch.
7. They were simply 25 distinct questions asked 8 million times.

<!-- @example -->

<!-- @input -->
|s| = 20,003, a 1,603-word dictionary

<!-- @output -->
55.0µs with a trie, 727.8µs with substring hashing

<!-- @why -->
The size where the remaining cost separates, and where it turns out not to be the recursion at all.

<!-- @walkthrough -->
1. All three memoised forms compute the same 20,004 states, so the state count cannot explain any difference between them.
2. The memoised recursion expands 10,003 of them before finding a segmentation and stopping.
3. Bottom-up DP fills all 20,004 and measures 1,151.0µs against the recursion's 727.8µs — 1.59x for the states it did not need.
4. Both build a substring for every position and length, which is up to 20,003 × 7 allocations and hashes.
5. The trie version does the same character comparisons with no allocation and measures 55.0µs — 13.17x against the recursion.
6. On the unsatisfiable variant the ordering of the first two reverses, 5,227.6µs against 4,688.2µs, while the trie stays ahead at 664.9µs.
7. In Python the trie advantage nearly vanishes, since slicing runs in C and the trie walk does not.

<!-- @visualization custom -->

<!-- @description -->
Open by making the difference from the rest of the topic visible. Draw two small trees side by side. On the left, Combination Sum's tree with the dead-end nodes hollowed out, captioned branches that cannot finish — 80.7%. On the right, Word Break's tree for "catsandog" with position 7 reached by two different paths, both drawn in full and both shaded as legitimate, captioned branches already answered. The point is that the left tree wants a guard and the right one cannot use one.

The second panel is the collapse. Draw the un-memoised tree for a short adversarial case as a wide fan, then the same computation as a strip of n + 1 boxes, one per position, with arrows from the fan collapsing onto them — many nodes landing on the same box. Beside it put the table: at n = 24, 8,146,016 calls against 91, with 25 stored positions. Print n + 1 in large type as the state count and note it holds at n = 5000. Under the fan, mark the growth base 1.9276 and label it the tetranacci constant, with a note that lengths 1–2 give phi instead.

The third panel is the top-down against bottom-up reversal, and it should be one figure with two halves. On the satisfiable half, show the position strip with only the visited cells filled — about half of them — and the bars 727.8µs against 1,151.0µs, tagged 0.63x. On the unsatisfiable half, show every cell filled in both, and the bars 5,227.6µs against 4,688.2µs, tagged 1.12x. The caption should be that top-down computes only what it needs and that only helps when the answer is yes.

Close on where the time actually goes. Show one position with the hashing version building seven substrings and hashing each, against the trie version walking seven characters down a tree and allocating nothing. Then four bars: C++ 727.8 and 55.0, Python 6.20 and 6.38. Tag the C++ pair 13.17x and the Python pair break-even, with the caption that slicing runs in C and a trie walk does not — so the same idea is transformative in one language and marginal in the other.

<!-- @sampleInput -->
```json
{"primary":{"s":"catsandog","dict":["cats","dog","sand","and","cat"],"result":false,"why":"position 7 is reached via cats+and and via cat+sand, and both ask the identical question","sharedPosition":7,"routes":[["cats","and"],["cat","sand"]]},"treeShape":{"earlierProblems":"branches that cannot finish — combination sum measured 80.7% dead ends","thisProblem":"branches already answered — nothing is illegal, so no guard applies","fix":"memoisation, not pruning"},"stateCollapse":{"claim":"the answer depends only on the position, so there are exactly n+1 distinct states","adversarial":{"s":"a*n + b","dict":["a","aa","aaa","aaaa"],"rows":[{"n":12,"plainCalls":3096,"memoCalls":43,"memoEntries":13,"ratio":72.0},{"n":16,"plainCalls":42744,"memoCalls":59,"memoEntries":17,"ratio":724.5},{"n":20,"plainCalls":590081,"memoCalls":75,"memoEntries":21,"ratio":7867.7},{"n":24,"plainCalls":8146016,"memoCalls":91,"memoEntries":25,"ratio":89516.7}]},"holdsAtScale":[{"n":100,"entries":101,"calls":395},{"n":1000,"entries":1001,"calls":3995},{"n":5000,"entries":5001,"calls":19995}],"callFormula":"4n - 5 for a four-word dictionary"},"growthBase":{"claim":"the un-memoised growth base is exactly the k-bonacci constant of the dictionary's word lengths","rows":[{"lengths":"1-2","measured":1.6180,"constant":"phi"},{"lengths":"1-3","measured":1.8393,"constant":"tribonacci"},{"lengths":"1-4","measured":1.9276,"constant":"tetranacci"}],"note":"phi appears a third time in this topic — as recursion cost in fibonacci-number, as answer growth in generate-binary-strings, and here as duplicated work"},"topDownVsBottomUp":{"cpp":{"input":"|s| = 20,003, 1,603 words","unit":"us","minOf":200,"eachMeasuredTwice":true,"satisfiable":{"memo":727.8,"bottomUp":1151.0,"ratio":0.63,"statesExpanded":10003,"statesTotal":20004},"unsatisfiable":{"memo":5227.6,"bottomUp":4688.2,"ratio":1.12}},"python":{"unit":"ms","satisfiable":{"memo":6.20,"bottomUp":7.36,"ratio":0.84},"unsatisfiable":{"memo":32.92,"bottomUp":21.64,"ratio":1.52}},"reading":"top-down computes only the states it needs, which only helps when the answer is yes"},"whereTheTimeGoes":{"claim":"the DP was never the cost — the substring construction was","cpp":{"satisfiable":{"memo":727.8,"bottomUp":1151.0,"trie":55.0,"trieSpeedup":13.17},"unsatisfiable":{"memo":5227.6,"bottomUp":4688.2,"trie":664.9,"trieSpeedup":8.20}},"python":{"satisfiable":{"memo":6.20,"bottomUp":7.36,"trie":6.38},"unsatisfiable":{"memo":32.92,"bottomUp":21.64,"trie":11.42}},"reading":"s[i:i+L] in d runs in C while a trie walk is one interpreted dict lookup per character, so the same idea is 13.17x in C++ and break-even in Python"},"decidingVsEnumerating":{"claim":"memoisation makes the decision linear; it cannot make the enumeration polynomial, because the output is exponential","rows":[{"n":12,"segmentations":1490},{"n":20,"segmentations":283953},{"n":24,"segmentations":3919944},{"n":30,"segmentations":201061985}],"input":"a*n with dict {a, aa, aaa, aaaa}"},"arc":[{"recursion":"power set, subsets I and II","treeIsFullOf":"nothing wasted"},{"recursion":"no adjacent 1s, parentheses","treeIsFullOf":"nothing wasted — perfect guards"},{"recursion":"combination sum","treeIsFullOf":"80.7% dead ends"},{"recursion":"combination sum II","treeIsFullOf":"67.6% dead ends"},{"recursion":"combination sum III","treeIsFullOf":"0% — the guard is complete"},{"recursion":"word break","treeIsFullOf":"duplicates, not dead ends","fix":"memoisation"}]}
```

<!-- @highlights -->
- Two trees sit side by side: Combination Sum's with hollow dead ends, Word Break's with two full paths to position 7.
- The left is captioned branches that cannot finish, the right branches already answered.
- The point is marked that the left wants a guard and the right cannot use one.
- A wide fan collapses by arrows onto a strip of n + 1 position boxes.
- Many fan nodes are shown landing on the same box.
- The table beside it reads 8,146,016 calls against 91, over 25 stored positions.
- n + 1 is printed large as the state count, noted to hold at n = 5000.
- The growth base 1.9276 is marked under the fan and labelled the tetranacci constant.
- A note adds that dictionary lengths 1–2 give phi instead.
- The satisfiable half shows about half the position cells filled, with bars 727.8µs and 1,151.0µs tagged 0.63x.
- The unsatisfiable half shows every cell filled, with bars 5,227.6µs and 4,688.2µs tagged 1.12x.
- Their shared caption is that top-down computes only what it needs, which only helps when the answer is yes.
- One position is drawn twice: seven substrings built and hashed, against seven characters walked with no allocation.
- Four closing bars read C++ 727.8 and 55.0, Python 6.20 and 6.38.
- The C++ pair is tagged 13.17x and the Python pair break-even.
- The final caption is that slicing runs in C and a trie walk does not.

<!-- @edgeCases -->
- s = "" — vacuously breakable, so the answer is true and the base case returns immediately.
- An empty dictionary — false for any non-empty s, and the max-length computation must not be run on an empty collection.
- A dictionary containing the empty string — every position would match it with zero advance, so the recursion never progresses; filter it out or start lengths at 1.
- s equal to a single dictionary word — true in one step, and the case where top-down's early exit is at its most extreme.
- No word matching at position 0 — false after a single expansion, since nothing else is reachable.
- A dictionary word longer than s — never matches, and the length loop must be bounded by the remaining characters as well as by maxlen.
- Characters in s outside the dictionary's alphabet — the trie descent stops on the first one, where the hashing version still builds and hashes every slice.
- All words the same length — the inner loop still runs to maxlen unless bounded, so capping it matters even here.
- A very long s with short words — depth equals the number of pieces, so the recursion can exceed the default stack while the bottom-up version cannot.
- Repeated words in the dictionary — harmless for the set-based versions and harmless for the trie, which simply re-marks the same terminal node.
- An unsatisfiable instance — no early exit is possible, every state must be settled, and the top-down advantage reverses to a penalty.
- Asking for every segmentation rather than a yes or no — the answer itself can be exponential, 201,061,985 for a 30-character string, so no memo makes it polynomial.
- Case sensitivity — the dictionary and the string must agree, and a mismatch fails silently rather than raising.

<!-- @pitfalls -->
- Reaching for a guard. Nothing in this tree is illegal, so there is nothing to refuse — the branches are duplicates rather than dead ends, and only memoisation removes them.
- Using boolean[] for the memo in Java. It cannot distinguish not-yet-computed from computed-false, so every false position is recomputed on each visit and the exponential behaviour quietly returns.
- Not bounding the inner loop by the longest word. That turns Θ(n · maxlen) into Θ(n²), which for a 20,000-character string and words of length at most 7 is a factor of nearly 3,000.
- Forgetting that dp[n] is true. The empty suffix is breakable, and a false there makes every answer false.
- Iterating the DP forwards. The dependency runs from later positions to earlier ones, so the loop must go backwards or read cells that are not filled yet.
- Storing pointers into a trie held in a vector. push_back may reallocate and invalidate them; store indices instead, which is the bug that survives small tests and fails on a real dictionary.
- Assuming the trie always wins. It is 13.17x in C++ and roughly break-even in Python, because slicing runs in C there while the trie walk is interpreted.
- Assuming top-down and bottom-up are equivalent. Top-down stops on success and is 0.63x on a satisfiable instance; it has no early exit on an unsatisfiable one and becomes 1.12x.
- Using the recursion on a very long string. Depth is the number of pieces, so a long string of short words can overflow the stack where the iterative version cannot.
- Allowing an empty string in the dictionary. It matches everywhere and advances nothing, so the recursion never terminates.
- Expecting memoisation to fix the enumeration variant. It shares suffix results, but the output is exponential — 201,061,985 segmentations for a 30-character string — so nothing makes listing them polynomial.
- Describing the un-memoised cost as 2^n. The base is the k-bonacci constant of the dictionary's word lengths — 1.6180 for lengths 1–2, 1.9276 for 1–4 — which is smaller than 2 and exactly determined.
- Treating a trie sentinel as an ordinary key. A marker that could appear as a character would make that word's prefix look terminal.

<!-- @doubt -->
### Why does pruning not help here?

<!-- @answer -->
Because nothing is illegal. Every earlier problem in this topic had branches that could not lead to an answer — Combination Sum measured 80.7% of its nodes as dead ends, and Combination Sum III got that to zero with a complete guard. In this tree every branch is a legitimate split of the string. Position 7 can be reached through "cats"+"and" and through "cat"+"sand", and both are perfectly valid; they simply ask the same question twice. So there is nothing for a guard to refuse. The work is duplicated rather than wasted, and the machinery for duplicated work is memoisation. That is the reason this problem closes the medium set: it is the first one where the earlier tool does not apply at all.

<!-- @doubt -->
### Why are there only n + 1 states?

<!-- @answer -->
Because the answer depends only on where you are, not on how you got there. Whether the rest of the string can be broken starting at position 7 has nothing to do with which words consumed the first seven characters. There are n + 1 positions counting the end, so there are at most n + 1 distinct questions — however enormous the tree of paths becomes. Measured on the adversarial `"a"*n + "b"`, the memo holds exactly 25 entries at n = 24 while the un-memoised recursion makes 8,146,016 calls, and it holds exactly 5001 at n = 5000. The call count is linear too, 4n − 5 for a four-word dictionary, since each state is expanded once and tries at most four words.

<!-- @doubt -->
### What is the un-memoised complexity, exactly?

<!-- @answer -->
Exponential with a base determined by the dictionary's word lengths, not 2^n as it is often described. If the dictionary contains words of every length from 1 to L, the call count satisfies the L-step Fibonacci recurrence — each position sums the counts of the L positions after it — so the growth per additional character converges to the L-bonacci constant. Measured: 1.6180 for lengths 1–2, which is phi; 1.8393 for 1–3, the tribonacci constant; and 1.9276 for 1–4, tetranacci. It approaches 2 from below as L grows and never reaches it. Phi turns up here for the third time in this topic, having been the cost of a wasteful recursion in Fibonacci Number and the growth of an answer count in Generate Binary Strings.

<!-- @doubt -->
### Top-down or bottom-up?

<!-- @answer -->
Bottom-up as a default, top-down if the answer is usually yes. They compute the same n + 1 states, so the textbook line is that they are equivalent up to stack overhead — but only top-down can stop early. On a satisfiable 20,003-character instance the memoised recursion expanded 10,003 of the 20,004 states and measured 727.8µs against bottom-up's 1,151.0µs, which is 0.63x. On an unsatisfiable one there is nothing to stop for, every state must be settled either way, and the recursion pays call overhead for nothing — 5,227.6µs against 4,688.2µs, or 1.12x. Python shows the same reversal more strongly, 0.84x and 1.52x. Bottom-up also has no stack to overflow, which matters for a long string of short words.

<!-- @doubt -->
### Is the trie worth it?

<!-- @answer -->
In C++ decisively, in Python barely. The DP itself was never the cost — building a substring for every position and length, and hashing each one, was. Removing that measured 55.0µs against 727.8µs in C++, a factor of 13.17, and 664.9µs against 5,227.6µs on the unsatisfiable instance. In Python the same change gives 6.38ms against 6.20ms on the satisfiable case, which is break-even, because `s[i:i+L] in d` is a C-level slice and hash while the trie walk is one interpreted dict lookup per character. The rule is the one this topic has hit repeatedly: an optimisation is worth what the operation it removes was costing, and the two languages price these operations very differently.

<!-- @doubt -->
### Does memoisation fix the version that returns every segmentation?

<!-- @answer -->
No, and the reason is worth being precise about. Memoisation collapses the *decision* problem onto n + 1 states and makes it linear. The enumeration problem has an output that is itself exponential — the string `"a"*30` with dictionary `{a, aa, aaa, aaaa}` has 201,061,985 distinct segmentations, and any correct program must write all of them down. The same memo still helps, because a position reached by many prefixes can hand back its stored list of suffix segmentations instead of recomputing them, so the work per output shrinks. But no amount of sharing makes an exponential answer polynomial. "Add memoisation" is offered as the fix for both problems and only ever fixes one.

<!-- @doubt -->
### Why write false into the memo before recursing?

<!-- @answer -->
So that a position revisited while it is still being computed returns rather than recursing forever. In this specific problem it cannot happen — every recursive call moves strictly forward, so a position is never re-entered during its own computation — but the habit is what makes the pattern safe when it is transplanted. The moment a problem allows a zero-length move, or the state is something other than a strictly increasing index, an un-marked in-progress state becomes an infinite loop. Writing the pessimistic answer first is also what makes the memo double as a visited set, which is why the code here uses a plain dictionary rather than a caching decorator.

<!-- @doubt -->
### Does the dictionary size matter separately from memoisation?

<!-- @answer -->
Yes, and it is a second change worth separating out. The plain recursion loops over every dictionary word at each position, which is O(m); the memoised versions loop over every word *length* up to the longest and hash the slice, which is O(maxlen). Those are different costs entirely — with 1,624 words of length at most 7 the loop is 232 times shorter. Measured with memoisation held constant on both sides, so that only the loop shape differs, that is 68.73ms against 1.56ms, a factor of **44** — less than 232 because `startswith` fails fast while a slice-and-hash does not. Worth knowing because the two changes are usually made together and credited to the memo. The 89,516x figure quoted elsewhere in this file is memoisation alone: it uses a four-word dictionary with a longest word of four, where both loops are the same length.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
The medium set ends here, and the **Hard** set opens with **Letter Combinations of a Phone Number** — a deliberate reset, with no guard to place and no repeated states to memoise, just one branch per letter on each digit. After that the guard returns and gets much more expensive: **N-Queens**, **Sudoku Solver** and **Word Search** all need a test that is far from O(1), so the question becomes how to maintain the information a guard needs incrementally rather than recomputing it at every node. Word Break is the right place to pause because it is the one problem in the set where that question does not arise at all.
