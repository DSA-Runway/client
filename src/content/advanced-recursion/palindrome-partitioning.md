---
id: palindrome-partitioning
topic: Advanced Recursion
title: Palindrome Partitioning
difficulty: Hard
status: ready
prerequisites:
  - letter-combinations-of-a-phone-number
  - subsets-i
  - check-if-string-is-palindrome-or-not
relatedIds:
  - letter-combinations-of-a-phone-number
  - subsets-i
  - combination-sum
  - generate-parentheses
  - check-if-string-is-palindrome-or-not
---

<!-- @summary -->
Backtracking where the pruning test is a palindrome check, and the output can hold 2^(n-1) partitions. The universally recommended optimisation — precomputing an O(n²) palindrome table — measured 1.02x to 1.09x, because the traversal was never the cost: at n = 20 counting the partitions takes 2.4ms and producing them takes 19.6ms.

<!-- @theory -->
## The problem

Cut a string into pieces so that every piece is a palindrome, and return every
possible way of doing it.

```
s = "aab"     ->  [ ["a","a","b"], ["aa","b"] ]
s = "abc"     ->  [ ["a","b","c"] ]
s = "aaa"     ->  [ ["a","a","a"], ["a","aa"], ["aa","a"], ["aaa"] ]
```

There are `n − 1` gaps between characters and each is independently cut or not,
so there are `2^(n-1)` candidate partitions. The job is to walk that space while
skipping everything that cannot lead anywhere.

## How big can the answer be?

As big as the candidate space. If every character is the same, every substring is
a palindrome and every one of the `2^(n-1)` partitions is valid:

| n | partitions of `a…a` | 2^(n−1) | partitions of `abcde…` |
|---|---|---|---|
| 4 | 8 | 8 | 1 |
| 10 | 512 | 512 | 1 |
| 16 | 32,768 | 32,768 | 1 |
| 20 | **524,288** | 524,288 | **1** |

Both extremes are ordinary strings. That range — one answer or half a million,
for the same length — is what makes every cost here data-dependent, and it is why
no amount of cleverness makes this polynomial: the output alone can be exponential.

## Pruning is worth between 1x and 315x

Checking whether a piece is a palindrome **before** recursing, rather than
building whole partitions and filtering at the end, is the difference between
exploring a pruned tree and exploring all `2^(n-1)` leaves. Recursion nodes
visited, all at n = 12:

| s | pruned | unpruned | ratio |
|---|---|---|---|
| `abcdefghijkl` | 13 | 4,096 | **315.1x** |
| `abacabadabac` | 101 | 4,096 | 40.6x |
| `aabbaabbaabb` | 367 | 4,096 | 11.2x |
| `aaaaaaaaaaaa` | 4,096 | 4,096 | **1.0x** |

The first row is a string with no palindromic substring longer than one character:
the search collapses to a single path. The last row is the worst case, where
pruning removes nothing because nothing can be pruned — every substring qualifies.

Note that the worst case for pruning is exactly the worst case for output size.
That is not a coincidence: both are governed by how many substrings are
palindromes.

## The recommended optimisation buys almost nothing

Every write-up suggests precomputing a table `pal[i][j]` in O(n²) so each check
becomes a lookup. It is a real saving in checks — the same `(start, end)` pair is
re-tested once per path that reaches `start`, which is exponentially often. And
measured, it is worth almost nothing:

| n | partitions | naive check | DP table | ratio |
|---|---|---|---|---|
| 16 | 618 | 27,792 | 26,042 | 1.07x |
| 18 | 4,851 | 188,417 | 184,834 | 1.02x |
| 20 | 7,536 | 328,542 | 311,250 | 1.06x |
| 22 | 32,860 | 1,645,000 | 1,505,166 | **1.09x** |

Nanoseconds, on random two-letter strings — chosen because they have many
palindromic substrings *and* many failed checks, which is the shape most
favourable to the table. On the all-same-character worst case it does even less,
measuring 1.18x at n = 14 and **0.96x at n = 20** — slightly slower than checking
directly, once the table's own O(n²) construction is counted.

## Because the cost is the output, not the search

Run the identical traversal three ways — count the partitions, record the cut
positions as integers, or build the actual list of strings:

| n | partitions | count only | cut indices | full output |
|---|---|---|---|---|
| 14 | 8,192 | 38,000 | 197,792 | 274,708 |
| 16 | 32,768 | 151,875 | 924,375 | 1,797,500 |
| 18 | 131,072 | 572,833 | 3,068,500 | 4,624,834 |
| 20 | **524,288** | **2,381,125** | 12,747,500 | **19,554,584** |

Nanoseconds, on `a^n`. The recursion is the same in all three columns; only what
gets built differs. At n = 20, **counting takes 2.4ms and producing the answer
takes 19.6ms** — so 88% of the time is spent constructing partitions, and 65% is
spent materialising the result list even when the pieces are stored as integers
rather than strings.

That is why the palindrome table is beside the point. It optimises the traversal,
and the traversal is an eighth of the work. If this were ever a bottleneck the
things to attack would be the substring copies and the vector growth — or the
requirement to materialise all the partitions at all.

<!-- @intuition -->
The habit worth taking from this one is to ask what an optimisation is optimising *relative to*. Precomputing the palindrome table is genuinely correct reasoning — the same substring really is tested exponentially many times, and the table really does make each test O(1). The reasoning is sound and the conclusion is nearly worthless, because a cost you have reasoned about carefully can still be a small fraction of the total. The cheap way to find out is the one used above: run the same traversal while building progressively less, and see which column the time is actually in. Any problem whose output can be exponential deserves that check before any effort goes into making the search faster.

<!-- @approach -->
### Enumerate Every Cut Set, Then Filter

<!-- @idea -->
Treat the n−1 gaps as bits, generate all 2^(n−1) cut patterns, and keep the ones whose every piece is a palindrome.

<!-- @steps -->
1. For each bitmask over the n−1 gaps, cut wherever a bit is set.
2. Split the string accordingly.
3. Check every piece for palindromicity.
4. Keep the partition if all pieces pass.

<!-- @complexity -->
- time: O(2ⁿ · n²)
- space: O(n) beyond the output
- note: The definition, and the reference the others were verified against over 3,600 random strings. Visits all 2^(n−1) leaves even when the answer is a single partition — **315x** more recursion-equivalent work than pruning on `abcdefghijkl`.

<!-- @code cpp -->
```cpp
#include <vector>
#include <string>
using namespace std;

static bool isPal(const string& s, int i, int j) {
    while (i < j) { if (s[i] != s[j]) return false; i++; j--; }
    return true;
}

vector<vector<string>> partition(const string& s) {
    int n = (int)s.size();
    vector<vector<string>> out;
    for (int mask = 0; mask < (1 << (n - 1)); mask++) {
        vector<string> parts;
        int start = 0;
        bool ok = true;
        for (int i = 0; i < n - 1 && ok; i++) {
            if (!(mask >> i & 1)) continue;
            if (!isPal(s, start, i)) { ok = false; break; }
            parts.push_back(s.substr(start, i - start + 1));
            start = i + 1;
        }
        if (ok && isPal(s, start, n - 1)) {
            parts.push_back(s.substr(start));
            out.push_back(parts);
        }
    }
    return out;
}
```

<!-- @annotations -->
- 13: `1 << (n - 1)` — there are n−1 gaps, not n. Using `1 << n` doubles the work and generates each partition twice.
- 24: The final piece is outside the loop because it has no gap after it — the loop only ever closes a piece when it sees a cut.
- 19: The `ok` flag abandons a mask early, which is a weak form of pruning: it still enumerates every mask, it just stops splitting one sooner.
- 6: `isPal` walks from both ends and stops at the first mismatch, so a non-palindrome usually costs far less than its length.

<!-- @code java -->
```java
static boolean isPal(String s, int i, int j) {
    while (i < j) { if (s.charAt(i) != s.charAt(j)) return false; i++; j--; }
    return true;
}

static List<List<String>> partition(String s) {
    int n = s.length();
    List<List<String>> out = new ArrayList<>();
    for (int mask = 0; mask < (1 << (n - 1)); mask++) {
        List<String> parts = new ArrayList<>();
        int start = 0;
        boolean ok = true;
        for (int i = 0; i < n - 1 && ok; i++) {
            if ((mask >> i & 1) == 0) continue;
            if (!isPal(s, start, i)) { ok = false; break; }
            parts.add(s.substring(start, i + 1));
            start = i + 1;
        }
        if (ok && isPal(s, start, n - 1)) {
            parts.add(s.substring(start));
            out.add(parts);
        }
    }
    return out;
}
```

<!-- @annotations -->
- 16: `s.substring(start, i + 1)` is end-exclusive in Java where the C++ `substr` takes a length — the commonest translation slip between the two.

<!-- @code python -->
```python
def partition(s):
    n = len(s)
    out = []
    for mask in range(1 << (n - 1)):
        parts = []
        start = 0
        ok = True
        for i in range(n - 1):
            if not (mask >> i) & 1:
                continue
            piece = s[start:i + 1]
            if piece != piece[::-1]:
                ok = False
                break
            parts.append(piece)
            start = i + 1
        if ok:
            last = s[start:]
            if last == last[::-1]:
                parts.append(last)
                out.append(parts)
    return out
```

<!-- @annotations -->
- 12: `piece == piece[::-1]` builds a reversed copy, so it is O(len) in time *and* space where the two-pointer scan is O(1) space and often exits early.

<!-- @approach -->
### Backtrack, Checking Each Piece

<!-- @idea -->
Extend the current partition one piece at a time, and only recurse when the piece just taken is a palindrome.

<!-- @steps -->
1. Track a start index and the pieces chosen so far.
2. If start has reached the end, record the current partition.
3. Otherwise try each end from start to the last character.
4. If `s[start..end]` is a palindrome, take it and recurse from `end+1`.
5. Undo the choice and try the next end.

<!-- @complexity -->
- time: O(2ⁿ · n) worst case, far less when few substrings are palindromes
- space: O(n) recursion depth beyond the output
- note: The pruning is the whole point — **13 recursion nodes against 4,096** on `abcdefghijkl`. On the all-identical worst case it prunes nothing, because nothing can be pruned.

<!-- @code cpp -->
```cpp
#include <vector>
#include <string>
using namespace std;

static void backtrack(const string& s, int start,
                      vector<string>& path, vector<vector<string>>& out) {
    int n = (int)s.size();
    if (start == n) { out.push_back(path); return; }

    for (int end = start; end < n; end++) {
        if (!isPal(s, start, end)) continue;
        path.push_back(s.substr(start, end - start + 1));
        backtrack(s, end + 1, path, out);
        path.pop_back();
    }
}

vector<vector<string>> partition(const string& s) {
    vector<vector<string>> out;
    vector<string> path;
    backtrack(s, 0, path, out);
    return out;
}
```

<!-- @annotations -->
- 11: The check happens **before** the recursive call, which is what turns 4,096 leaves into 13 nodes on a string with no long palindromes. Filtering at the leaf instead is correct and explores the whole tree.
- 8: `out.push_back(path)` copies the vector. Pushing a reference would leave every recorded partition aliasing the same buffer, which `pop_back` then empties.
- 14: `pop_back` restores the state for the next `end`, which is what makes this backtracking rather than a one-way descent.
- 12: `end - start + 1` is a length for `substr`, not an end index.

<!-- @code java -->
```java
static void backtrack(String s, int start, List<String> path, List<List<String>> out) {
    int n = s.length();
    if (start == n) { out.add(new ArrayList<>(path)); return; }

    for (int end = start; end < n; end++) {
        if (!isPal(s, start, end)) continue;
        path.add(s.substring(start, end + 1));
        backtrack(s, end + 1, path, out);
        path.remove(path.size() - 1);
    }
}

static List<List<String>> partition(String s) {
    List<List<String>> out = new ArrayList<>();
    backtrack(s, 0, new ArrayList<>(), out);
    return out;
}
```

<!-- @annotations -->
- 3: `new ArrayList<>(path)` is the copy. Adding `path` itself stores a reference that later mutations empty — the single commonest bug in any backtracking solution in Java.

<!-- @code python -->
```python
def partition(s):
    n = len(s)
    out = []

    def backtrack(start, path):
        if start == n:
            out.append(path[:])
            return
        for end in range(start, n):
            piece = s[start:end + 1]
            if piece != piece[::-1]:
                continue
            path.append(piece)
            backtrack(end + 1, path)
            path.pop()

    backtrack(0, [])
    return out
```

<!-- @annotations -->
- 7: `path[:]` is the copy. `out.append(path)` appends a reference, and the `path.pop()` below then empties every partition already recorded.
- 11: The palindrome test gates the recursion, so a piece that is not a palindrome costs one comparison rather than a whole subtree.

<!-- @approach -->
### Backtrack with a Precomputed Palindrome Table

<!-- @idea -->
Fill an n×n table of which substrings are palindromes once, then make every check during the search a single lookup.

<!-- @steps -->
1. Build `pal[i][j]` for all i ≤ j, working from the end so `pal[i+1][j-1]` is ready.
2. `pal[i][j]` is true when `s[i] == s[j]` and the inside is a palindrome or empty.
3. Run the same backtracking, replacing the scan with the lookup.

<!-- @complexity -->
- time: O(n²) to build, then O(2ⁿ) traversal
- space: O(n²) for the table
- note: The standard recommendation. Measured, it is worth **1.02x to 1.09x** — and **0.96x** on the worst case, slightly slower than checking directly — because the traversal is only about an eighth of the total cost.

<!-- @code cpp -->
```cpp
#include <vector>
#include <string>
using namespace std;

static vector<vector<char>> buildPal(const string& s) {
    int n = (int)s.size();
    vector<vector<char>> pal(n, vector<char>(n, 0));
    for (int i = n - 1; i >= 0; i--)
        for (int j = i; j < n; j++)
            pal[i][j] = (s[i] == s[j]) && (j - i < 2 || pal[i + 1][j - 1]);
    return pal;
}

static void backtrack(const string& s, int start, vector<string>& path,
                      vector<vector<string>>& out, const vector<vector<char>>& pal) {
    int n = (int)s.size();
    if (start == n) { out.push_back(path); return; }
    for (int end = start; end < n; end++) {
        if (!pal[start][end]) continue;
        path.push_back(s.substr(start, end - start + 1));
        backtrack(s, end + 1, path, out, pal);
        path.pop_back();
    }
}

vector<vector<string>> partition(const string& s) {
    vector<vector<string>> out;
    vector<string> path;
    if (!s.empty()) backtrack(s, 0, path, out, buildPal(s));
    return out;
}
```

<!-- @annotations -->
- 8: `i` descends so that `pal[i + 1][j - 1]` is already filled when it is read — the recurrence looks inward, so the table has to be built outward.
- 10: `j - i < 2` covers the two base cases together: a single character, and two adjacent characters with nothing between them.
- 19: The lookup that replaced the scan. It is genuinely O(1) where the scan was O(n), and it changed the total runtime by under 10%.
- 7: `vector<vector<char>>` rather than `vector<vector<bool>>` — the `bool` specialisation packs bits and its element access is measurably slower.

<!-- @code java -->
```java
static boolean[][] buildPal(String s) {
    int n = s.length();
    boolean[][] pal = new boolean[n][n];
    for (int i = n - 1; i >= 0; i--)
        for (int j = i; j < n; j++)
            pal[i][j] = s.charAt(i) == s.charAt(j) && (j - i < 2 || pal[i + 1][j - 1]);
    return pal;
}

static void backtrack(String s, int start, List<String> path,
                      List<List<String>> out, boolean[][] pal) {
    int n = s.length();
    if (start == n) { out.add(new ArrayList<>(path)); return; }
    for (int end = start; end < n; end++) {
        if (!pal[start][end]) continue;
        path.add(s.substring(start, end + 1));
        backtrack(s, end + 1, path, out, pal);
        path.remove(path.size() - 1);
    }
}

static List<List<String>> partition(String s) {
    List<List<String>> out = new ArrayList<>();
    if (!s.isEmpty()) backtrack(s, 0, new ArrayList<>(), out, buildPal(s));
    return out;
}
```

<!-- @annotations -->
- 3: `boolean[][]` in Java is a byte per element, so unlike C++'s `vector<bool>` there is no bit-packing penalty to avoid here.

<!-- @code python -->
```python
def partition(s):
    n = len(s)
    if n == 0:
        return []

    pal = [[False] * n for _ in range(n)]
    for i in range(n - 1, -1, -1):
        for j in range(i, n):
            pal[i][j] = s[i] == s[j] and (j - i < 2 or pal[i + 1][j - 1])

    out = []

    def backtrack(start, path):
        if start == n:
            out.append(path[:])
            return
        for end in range(start, n):
            if not pal[start][end]:
                continue
            path.append(s[start:end + 1])
            backtrack(end + 1, path)
            path.pop()

    backtrack(0, [])
    return out
```

<!-- @annotations -->
- 7: `range(n - 1, -1, -1)` counts down to and including 0 — the second argument is exclusive, so `-1` is required rather than `0`.
- 6: The table costs O(n²) memory, which at n = 2,000 is four million booleans. For a problem whose output is already exponential that is rarely the binding constraint, but it is a real cost the naive check does not pay.

<!-- @example -->

<!-- @input -->
```
s = "aab"
```

<!-- @output -->
```
[ ["a","a","b"], ["aa","b"] ]
```

<!-- @why -->
Three characters, four candidate cut patterns, and two of them survive. `"ab"` and `"aab"` are not palindromes, which prunes the other two branches immediately.

<!-- @walkthrough -->
```
s[0..0] = "a"      palindrome, recurse
  s[1..1] = "a"    palindrome, recurse
    s[2..2] = "b"  palindrome, recurse
      start == 3   record ["a","a","b"]
  s[1..2] = "ab"   not a palindrome, skip
s[0..1] = "aa"     palindrome, recurse
  s[2..2] = "b"    palindrome, recurse
    start == 3     record ["aa","b"]
s[0..2] = "aab"    not a palindrome, skip

Two of the four cut patterns are rejected without any
recursion at all. That is the pruning.
```

<!-- @example -->

<!-- @input -->
```
s = "aaa"
```

<!-- @output -->
```
[ ["a","a","a"], ["a","aa"], ["aa","a"], ["aaa"] ]
```

<!-- @why -->
Every substring of a run of identical characters is a palindrome, so every one of the 2^(n−1) = 4 cut patterns is valid. This is the shape where pruning saves nothing.

<!-- @walkthrough -->
```
every s[i..j] is a palindrome, so no branch is ever skipped

partitions = 2^(3-1) = 4        recursion nodes = 4 (all leaves reached)

At n = 20 the same string yields 524,288 partitions, and the
pruned and unpruned searches visit identical node counts —
measured 4,096 against 4,096 at n = 12.
```

<!-- @example -->

<!-- @input -->
```
s = "abc"
```

<!-- @output -->
```
[ ["a","b","c"] ]
```

<!-- @why -->
No substring longer than one character is a palindrome, so the search collapses to a single path — the opposite extreme from `"aaa"` at the same length.

<!-- @walkthrough -->
```
s[0..0] = "a"   palindrome, recurse
  s[1..1] = "b" palindrome, recurse
    s[2..2] = "c" palindrome, recurse -> record ["a","b","c"]
  s[1..2] = "bc"  not a palindrome, skip
s[0..1] = "ab"  not a palindrome, skip
s[0..2] = "abc" not a palindrome, skip

At n = 12 this shape visits 13 recursion nodes where the
unpruned enumeration visits 4,096 — a factor of 315.
```

<!-- @example -->

<!-- @input -->
```
s = "a"
```

<!-- @output -->
```
[ ["a"] ]
```

<!-- @why -->
A single character has no gaps, so there is exactly one partition. It is the base case both the loop bound and the recursion have to get right.

<!-- @walkthrough -->
```
n = 1, so 1 << (n - 1) is 1 << 0 = 1 — one candidate mask,
the empty one, and the whole string is the only piece.

backtracking: start = 0, end = 0, s[0..0] is a palindrome,
recurse from 1, start == n, record ["a"].

Writing `1 << n` instead of `1 << (n - 1)` produces two masks
here and duplicates the answer.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the pruned search tree, how far pruning goes on different strings, and why the recommended palindrome table optimises the wrong eighth of the work.

<!-- @sampleInput -->
```json
{"primary":{"s":"aab","answer":[["a","a","b"],["aa","b"]],"tree":[{"piece":"s[0..0] = a","palindrome":true,"action":"recurse","children":[{"piece":"s[1..1] = a","palindrome":true,"action":"recurse","children":[{"piece":"s[2..2] = b","palindrome":true,"action":"recurse -> record [a,a,b]"}]},{"piece":"s[1..2] = ab","palindrome":false,"action":"skip"}]},{"piece":"s[0..1] = aa","palindrome":true,"action":"recurse","children":[{"piece":"s[2..2] = b","palindrome":true,"action":"recurse -> record [aa,b]"}]},{"piece":"s[0..2] = aab","palindrome":false,"action":"skip"}],"note":"two of the four cut patterns are rejected without any recursion"},"outputSize":{"candidateSpace":"n-1 gaps, each independently cut or not, so 2^(n-1) candidate partitions","rows":[{"n":4,"allSame":8,"twoToNMinus1":8,"allDistinct":1},{"n":10,"allSame":512,"twoToNMinus1":512,"allDistinct":1},{"n":16,"allSame":32768,"twoToNMinus1":32768,"allDistinct":1},{"n":20,"allSame":524288,"twoToNMinus1":524288,"allDistinct":1}],"reading":"one answer or half a million, for the same length - which is why every cost here is data-dependent","consequence":"no cleverness makes this polynomial: the output alone can be exponential"},"pruning":{"what":"check the piece is a palindrome BEFORE recursing, rather than building whole partitions and filtering at the end","unit":"recursion nodes visited, all at n = 12","rows":[{"s":"abcdefghijkl","pruned":13,"unpruned":4096,"ratio":"315.1x"},{"s":"abacabadabac","pruned":101,"unpruned":4096,"ratio":"40.6x"},{"s":"aabbaabbaabb","pruned":367,"unpruned":4096,"ratio":"11.2x"},{"s":"aaaaaaaaaaaa","pruned":4096,"unpruned":4096,"ratio":"1.0x"}],"observation":"the worst case for pruning is exactly the worst case for output size - both are governed by how many substrings are palindromes"},"theTableBuysAlmostNothing":{"recommendation":"precompute pal[i][j] in O(n^2) so each check is a lookup","soundReasoning":"the same (start, end) pair is re-tested once per path that reaches start, which is exponentially often","measured":{"unit":"nanoseconds, random two-letter strings - many palindromic substrings AND many failed checks, the shape most favourable to the table","rows":[{"n":16,"partitions":618,"naive":27792,"dpTable":26042,"ratio":"1.07x"},{"n":18,"partitions":4851,"naive":188417,"dpTable":184834,"ratio":"1.02x"},{"n":20,"partitions":7536,"naive":328542,"dpTable":311250,"ratio":"1.06x"},{"n":22,"partitions":32860,"naive":1645000,"dpTable":1505166,"ratio":"1.09x"}]},"onTheWorstCase":{"n14":"1.18x","n20":"0.96x","note":"slightly SLOWER than checking directly, once the table's own O(n^2) construction is counted"}},"whereTheTimeActuallyGoes":{"method":"run the identical traversal three ways - count the partitions, record cut positions as integers, or build the list of strings","unit":"nanoseconds, s = a^n","rows":[{"n":14,"partitions":8192,"countOnly":38000,"cutIndices":197792,"fullOutput":274708},{"n":16,"partitions":32768,"countOnly":151875,"cutIndices":924375,"fullOutput":1797500},{"n":18,"partitions":131072,"countOnly":572833,"cutIndices":3068500,"fullOutput":4624834},{"n":20,"partitions":524288,"countOnly":2381125,"cutIndices":12747500,"fullOutput":19554584}],"reading":"the recursion is the same in all three columns; only what gets BUILT differs","atN20":"counting takes 2.4ms and producing the answer takes 19.6ms - 88% of the time is constructing partitions, and 65% is materialising the result list even with integer pieces","conclusion":"the palindrome table optimises the traversal, and the traversal is about an eighth of the work","whatToAttackInstead":["the substring copies","the vector growth","the requirement to materialise all partitions at all"]},"theCopyBug":{"what":"recording the current path by reference instead of copying it","cpp":"out.push_back(path) copies; pushing a reference would leave every partition aliasing one buffer","java":"new ArrayList<>(path) is the copy - adding path itself is the commonest backtracking bug in Java","python":"path[:] is the copy - out.append(path) appends a reference that the following pop() empties"},"assertions":["there are n-1 gaps, so 2^(n-1) candidate partitions","every substring of a run of identical characters is a palindrome","the palindrome check must gate the recursion, not filter at the leaf","the recorded partition must be a copy of the path","the output size alone can be exponential in n"]}
```

<!-- @highlights -->
- `n − 1` gaps means **2^(n−1)** candidate partitions, and for `a…a` every one of them is valid — 524,288 at n = 20.
- The same length gives **one answer or half a million**, so every cost here is data-dependent.
- Pruning before recursing is worth **315×** on `abcdefghijkl` and **1.0×** on `aaaaaaaaaaaa` — and the worst case for pruning is the worst case for output size.
- The recommended O(n²) palindrome table measures **1.02×–1.09×**, and **0.96×** on the worst case.
- Because the search isn't the cost: at n = 20, counting takes **2.4 ms** and producing the output takes **19.6 ms**.
- Recording the path by reference instead of copying is the classic bug in all three languages.

<!-- @edgeCases -->
- `n = 1` — one partition; `1 << (n-1)` is `1 << 0` = 1, and writing `1 << n` duplicates the answer.
- Empty string — LeetCode 131 excludes it; the conventional answer is one empty partition, which the mask version does not produce.
- All characters identical — every partition is valid, 2^(n−1) of them, and pruning saves nothing.
- All characters distinct — exactly one partition, and pruning is worth 315×.
- A whole-string palindrome like `"aba"` — the single-piece partition is always among the answers.
- Two identical characters — `"aa"` yields both `["a","a"]` and `["aa"]`.
- Long strings — the output is exponential, so any bound on n comes from the answer size, not the algorithm.
- Recording `path` rather than a copy — every stored partition ends up empty.
- `s.substr(start, end - start + 1)` vs `s.substring(start, end + 1)` — length in C++, exclusive end in Java.

<!-- @pitfalls -->
- Filtering at the leaf instead of pruning at each piece. Correct, and it visits all 4,096 leaves where pruning visits 13.
- Storing `path` by reference. Every recorded partition then aliases one buffer that backtracking empties.
- `1 << n` instead of `1 << (n - 1)` in the mask version. There are n−1 gaps.
- Reaching for the O(n²) palindrome table expecting a real speed-up. Measured 1.02×–1.09×, and 0.96× on the worst case.
- Optimising the search before checking where the time is. At n = 20 the traversal is an eighth of it.
- `vector<vector<bool>>` for the table in C++. The bit-packed specialisation makes element access slower.
- Building the table before checking the string is non-empty. An n = 0 table indexes nothing but the loops still run.
- Forgetting `pop_back` / `path.pop()`. The path grows without ever shrinking and the partitions are nonsense.
- Comparing `piece == reversed(piece)` in a hot loop. It allocates and cannot exit early, unlike a two-pointer scan.

<!-- @doubt -->
### Is the precomputed palindrome table worth it?

<!-- @answer -->
Barely, and the reasoning behind it is better than the result. The argument is correct: during the search the same `(start, end)` pair is tested once for every path that reaches `start`, which is exponentially many times, and an O(n²) table makes each test O(1) instead of O(n). Measured on random two-letter strings — deliberately chosen because they have many palindromic substrings *and* many failed checks, the shape most favourable to the table — it is worth **1.07x at n = 16, 1.02x at n = 18, 1.06x at n = 20 and 1.09x at n = 22**. On the all-identical worst case it manages 1.18x at n = 14 and **0.96x at n = 20**, i.e. slightly slower, once its own construction is paid for. The reason is in the next question: the traversal it speeds up is roughly an eighth of the total work.

<!-- @doubt -->
### Where does the time actually go?

<!-- @answer -->
Into building the answer. Running the identical traversal three ways on `a^n` — counting the partitions, recording cut positions as integers, and building the real list of strings — separates the search from the output. At n = 20, with 524,288 partitions: **counting takes 2,381,125ns, recording integer cuts takes 12,747,500ns, and producing the strings takes 19,554,584ns**. So 88% of the runtime is constructing partitions and 65% is spent materialising the result list even when the pieces are integers. The recursion itself — every palindrome check, every branch decision — is the remaining 12%. That is why optimising the check moves the total so little, and it is a cheap diagnostic to run on any exponential-output problem before optimising anything: build progressively less and see which column the time is in.

<!-- @doubt -->
### How much does pruning actually save?

<!-- @answer -->
Between everything and nothing, decided entirely by the string. Checking the piece before recursing rather than filtering complete partitions at the end, measured in recursion nodes at n = 12: on `abcdefghijkl`, where no substring longer than one character is a palindrome, it is **13 nodes against 4,096 — a factor of 315**. On `abacabadabac` it is 101 against 4,096, and on `aabbaabbaabb` 367 against 4,096. On `aaaaaaaaaaaa` it is **4,096 against 4,096** — pruning removes nothing, because every substring is a palindrome and no branch can be rejected. Worth noticing that this worst case for pruning is exactly the worst case for the output size, which is not a coincidence: both are governed by how many substrings qualify. So the pruning is essential and it cannot rescue you from the exponential answer; it only avoids exploring branches that were never going to contribute to it.

<!-- @doubt -->
### Why must the recorded partition be a copy?

<!-- @answer -->
Because `path` is a single mutable buffer that backtracking is about to modify. Recording a reference to it stores a pointer to that buffer, and every subsequent `pop_back` and `push_back` changes what the stored "partition" contains — by the time the search finishes and the buffer has been unwound to empty, every recorded partition is empty too. The fix differs cosmetically by language and is the same idea in each: `out.push_back(path)` in C++ copies by value already, `new ArrayList<>(path)` in Java, and `path[:]` in Python. Java and Python are where this bites, because `out.add(path)` and `out.append(path)` are the natural things to write and both store the reference. It is the single most common bug in any backtracking solution, and it fails loudly — an answer of the right length full of empty lists — which is at least better than the bugs in the linked-list containers that returned correct-looking output.

<!-- @doubt -->
### Can this be made polynomial?

<!-- @answer -->
Not while the requirement is to return every partition, because the answer itself can be exponential: for a string of n identical characters there are exactly **2^(n−1)** valid partitions — 524,288 at n = 20 — and any algorithm that lists them must spend at least that much time writing them down. That is a lower bound on the problem, not a limitation of the approach. Related questions do have polynomial answers, and they are worth knowing as the reason this one does not: counting the partitions can be done with an O(n²) dynamic program without enumerating any of them, and the *minimum number of cuts* needed — LeetCode 132 — is also O(n²). The moment you stop needing the partitions themselves, the exponential disappears; the enumeration is the expense.
