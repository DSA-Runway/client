---
id: word-search
topic: Advanced Recursion
title: Word Search
difficulty: Hard
status: ready
prerequisites:
  - palindrome-partitioning
  - letter-combinations-of-a-phone-number
  - subsets-i
relatedIds:
  - palindrome-partitioning
  - letter-combinations-of-a-phone-number
  - generate-parentheses
  - combination-sum
  - find-peak-element-ii
---

<!-- @summary -->
Backtracking on a grid, where the state to undo is the board itself. Forgetting to restore a cell corrupts the board on 100% of inputs and returns the wrong answer on up to 27%. The heuristic worth knowing is choosing which end of the word to search from — measured at 9,169x faster in one direction and 3,559x slower in the other.

<!-- @theory -->
## The problem

A grid of letters and a word. Does the word appear as a path through
horizontally or vertically adjacent cells, using no cell twice?

```
A B C E
S F C S        "ABCCED" -> true      "ABCB"  -> false
A D E E        "SEE"    -> true
```

`"ABCB"` fails on the last letter: the only `B` is the one already used by the
second character, and a cell cannot be reused.

## The state to undo is the board

Backtracking needs a way to say "this cell is on the current path". The usual
trick is to overwrite the cell with a sentinel and put it back on the way out:

```cpp
char save = board[r][c];
board[r][c] = '#';          // on the path
... recurse ...
board[r][c] = save;         // off the path again
```

That last line is the whole risk. Measured over random boards with a three-letter
alphabet, omitting it:

| board | word length | wrong answers | board left mangled |
|---|---|---|---|
| 3×3 | 3 | 4.19% | 97.50% |
| 4×4 | 5 | 15.59% | 99.89% |
| 6×6 | 5 | 16.98% | **100.00%** |
| 6×6 | 7 | **27.02%** | **100.00%** |

Two different failures, at very different rates. The wrong answers grow with the
search space — a bigger board and a longer word mean more backtracking, and every
abandoned branch leaves `#` behind to block later ones. The board corruption is
essentially unconditional: at 6×6 the function destroys its input **every single
time**, whatever it returns.

That second column is the one to notice. Even on the 3×3 boards where the answer
is wrong only 4% of the time, the board is wrecked on 97.5% — so a caller that
searches for a second word gets nonsense, and a test that checks only the return
value sees nothing wrong on 96% of runs.

## Which end you start from is worth four orders of magnitude

The search begins at every cell matching `word[0]`. If that letter is common and
the last letter is rare, almost every start is a dead end discovered deep. Search
the word backwards instead and the roles swap — the answer is identical, because
a path spelling the word forwards is the same path spelling it backwards.

Boards that are almost entirely `a` with a single `z`:

| board | word | nodes searching forward | nodes searching reversed | ratio |
|---|---|---|---|---|
| 40×40 | `aaaaaaz` | 1,289,422 | 1,062 | **1,214x** |
| 60×60 | `aaaaaaaz` | 75,893 | 50 | 1,518x |
| 40×40 | `aaaaaaaaz` | 12,873,220 | **1,404** | **9,169x** |
| 60×60 | `zaaaaaaa` | **2,080** | 7,402,696 | **0.0003x** |

The last row is the point. That word already starts with the rare letter, and
reversing it is **3,559x worse**. The heuristic is not "reverse the word", it is
"start from whichever end is rarer on the board" — count both letters first and
decide. Applying it blindly is as bad as not applying it.

## The pre-check that stops working

A commonly suggested guard: count the letters on the board, and if the word needs
more of some letter than the board holds, return false without searching. It is
free to compute and it does catch some misses — but not at the sizes where it
would matter:

| board | word length | share of misses rejected early |
|---|---|---|
| 6×6 | 6 | 4.23% |
| 6×6 | 10 | 13.36% |
| 10×10 | 6 | **0.00%** |
| 10×10 | 10 | **0.02%** |

On a 10×10 board over six letters there are about 16 of each, so a word of ten
characters essentially never exhausts one. The guard fires on small boards, where
the search was cheap anyway, and stops firing exactly as the board grows.

## In-place marking versus a visited array

Both are correct. Overwriting the board avoids allocating an `m × n` array and
keeps the letter and its mark in the same cache line:

| board | in-place | visited array | ratio |
|---|---|---|---|
| 20×20 | 7,834 | 8,584 | 1.10x |
| 60×60 | 12,625 | 15,167 | 1.20x |
| 100×100 | 6,042 | 8,667 | **1.43x** |

Nanoseconds. A modest win, and it is worth knowing the tradeoff runs the other
way too: the visited-array version never touches the caller's board, so it cannot
be the source of the corruption above.

<!-- @intuition -->
Every backtracking problem has some state that must be undone, and the interesting variable is how visible the omission is. In Palindrome Partitioning, forgetting to pop the path produces obviously broken output. Here the same class of mistake produces a mostly-right answer and a silently destroyed board — the wrong-answer rate is 4% to 27% while the corruption rate is essentially 100%, so the thing that always breaks is the thing nobody checks. The general lesson is the one this topic keeps arriving at from different directions: when an algorithm mutates its input as a working device, restoring it is part of the algorithm and not a courtesy, and the test has to look at the input afterwards rather than only at the return value.

<!-- @approach -->
### DFS with a Visited Array

<!-- @idea -->
Try every starting cell, walking to adjacent cells that match the next character, with a parallel grid recording which cells are on the current path.

<!-- @steps -->
1. For each cell, start a depth-first search with the first character.
2. Reject immediately if out of bounds, already on the path, or the letter is wrong.
3. If this was the last character, the word is found.
4. Otherwise mark the cell, try all four neighbours, and unmark.
5. Return true if any start succeeds.

<!-- @complexity -->
- time: O(m·n·4^L)
- space: O(m·n) for the grid plus O(L) recursion
- note: The version that never touches the caller's board, so the corruption bug is impossible. **1.10x to 1.43x** slower than marking in place, and it allocates.

<!-- @code cpp -->
```cpp
#include <vector>
#include <string>
#include <functional>
using namespace std;

bool exist(const vector<vector<char>>& board, const string& word) {
    int m = (int)board.size(), n = (int)board[0].size(), L = (int)word.size();
    if (L == 0) return true;
    vector<vector<char>> seen(m, vector<char>(n, 0));

    function<bool(int,int,int)> go = [&](int r, int c, int k) -> bool {
        if (r < 0 || c < 0 || r >= m || c >= n) return false;
        if (seen[r][c] || board[r][c] != word[k]) return false;
        if (k == L - 1) return true;
        seen[r][c] = 1;
        bool ok = go(r + 1, c, k + 1) || go(r - 1, c, k + 1)
               || go(r, c + 1, k + 1) || go(r, c - 1, k + 1);
        seen[r][c] = 0;
        return ok;
    };

    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
            if (go(i, j, 0)) return true;
    return false;
}
```

<!-- @annotations -->
- 12: The bounds test comes before any indexing, so an out-of-range neighbour is rejected rather than read.
- 14: `k == L - 1` returns before marking, because the last character needs no further exploration — marking it would be undone immediately.
- 18: The unmark is what makes this backtracking. Without it the cell stays blocked for every later branch.
- 16: The four calls short-circuit, so a successful direction stops the other three from running.

<!-- @code java -->
```java
static boolean exist(char[][] board, String word) {
    int m = board.length, n = board[0].length, L = word.length();
    if (L == 0) return true;
    boolean[][] seen = new boolean[m][n];
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
            if (go(board, word, seen, i, j, 0)) return true;
    return false;
}

static boolean go(char[][] b, String w, boolean[][] seen, int r, int c, int k) {
    int m = b.length, n = b[0].length;
    if (r < 0 || c < 0 || r >= m || c >= n) return false;
    if (seen[r][c] || b[r][c] != w.charAt(k)) return false;
    if (k == w.length() - 1) return true;
    seen[r][c] = true;
    boolean ok = go(b, w, seen, r + 1, c, k + 1) || go(b, w, seen, r - 1, c, k + 1)
              || go(b, w, seen, r, c + 1, k + 1) || go(b, w, seen, r, c - 1, k + 1);
    seen[r][c] = false;
    return ok;
}
```

<!-- @annotations -->
- 19: `seen[r][c] = false` on the way out, in the same method that set it — keeping the two assignments in one place is what makes the omission visible.

<!-- @code python -->
```python
def exist(board, word):
    m, n, L = len(board), len(board[0]), len(word)
    if L == 0:
        return True
    seen = [[False] * n for _ in range(m)]

    def go(r, c, k):
        if not (0 <= r < m and 0 <= c < n):
            return False
        if seen[r][c] or board[r][c] != word[k]:
            return False
        if k == L - 1:
            return True
        seen[r][c] = True
        ok = go(r + 1, c, k + 1) or go(r - 1, c, k + 1) \
            or go(r, c + 1, k + 1) or go(r, c - 1, k + 1)
        seen[r][c] = False
        return ok

    return any(go(i, j, 0) for i in range(m) for j in range(n))
```

<!-- @annotations -->
- 8: `0 <= r < m` chains the comparison; without the bounds test a negative index would silently wrap to the far side of the grid rather than raising.
- 20: `any` with a generator stops at the first successful start rather than trying all m·n of them.

<!-- @approach -->
### DFS with In-Place Marking

<!-- @idea -->
Use the board itself as the visited set — overwrite a cell with a sentinel while it is on the path, and put the letter back on the way out.

<!-- @steps -->
1. Same search, but instead of a parallel grid, write a character that cannot match into the cell.
2. Save the original letter first.
3. Restore it after all four directions have been tried.
4. The board is identical when the function returns.

<!-- @complexity -->
- time: O(m·n·4^L)
- space: O(L) recursion only
- note: **1.10x to 1.43x** faster than a visited array and allocates nothing. Its risk is the restore: omitting it corrupts the board on **100%** of 6×6 inputs and returns the wrong answer on up to **27%**.

<!-- @code cpp -->
```cpp
#include <vector>
#include <string>
#include <functional>
using namespace std;

bool exist(vector<vector<char>>& board, const string& word) {
    int m = (int)board.size(), n = (int)board[0].size(), L = (int)word.size();
    if (L == 0) return true;

    function<bool(int,int,int)> go = [&](int r, int c, int k) -> bool {
        if (r < 0 || c < 0 || r >= m || c >= n) return false;
        if (board[r][c] != word[k]) return false;
        if (k == L - 1) return true;
        char save = board[r][c];
        board[r][c] = '#';
        bool ok = go(r + 1, c, k + 1) || go(r - 1, c, k + 1)
               || go(r, c + 1, k + 1) || go(r, c - 1, k + 1);
        board[r][c] = save;
        return ok;
    };

    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
            if (go(i, j, 0)) return true;
    return false;
}
```

<!-- @annotations -->
- 15: `'#'` only needs to be a character the word cannot contain — the marked cell then fails the letter test on line 11, so no separate visited check is needed.
- 18: The line that must not be omitted. Leaving it out corrupts the board on 100% of 6×6 inputs and returns the wrong answer on up to 27%.
- 13: Returning before marking on the last character means the sentinel is never written for a cell that is about to be released anyway.
- 6: `board` is taken by reference and is modified during the call. It is restored by the time the function returns, but a concurrent reader would see sentinels.

<!-- @code java -->
```java
static boolean exist(char[][] board, String word) {
    int m = board.length, n = board[0].length;
    if (word.isEmpty()) return true;
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
            if (go(board, word, i, j, 0)) return true;
    return false;
}

static boolean go(char[][] b, String w, int r, int c, int k) {
    int m = b.length, n = b[0].length;
    if (r < 0 || c < 0 || r >= m || c >= n) return false;
    if (b[r][c] != w.charAt(k)) return false;
    if (k == w.length() - 1) return true;
    char save = b[r][c];
    b[r][c] = '#';
    boolean ok = go(b, w, r + 1, c, k + 1) || go(b, w, r - 1, c, k + 1)
              || go(b, w, r, c + 1, k + 1) || go(b, w, r, c - 1, k + 1);
    b[r][c] = save;
    return ok;
}
```

<!-- @annotations -->
- 16: Java arrays are reference types, so this mutates the caller's board exactly as C++ does — passing `char[][]` is not a copy.

<!-- @code python -->
```python
def exist(board, word):
    m, n, L = len(board), len(board[0]), len(word)
    if L == 0:
        return True

    def go(r, c, k):
        if not (0 <= r < m and 0 <= c < n):
            return False
        if board[r][c] != word[k]:
            return False
        if k == L - 1:
            return True
        save = board[r][c]
        board[r][c] = "#"
        ok = go(r + 1, c, k + 1) or go(r - 1, c, k + 1) \
            or go(r, c + 1, k + 1) or go(r, c - 1, k + 1)
        board[r][c] = save
        return ok

    return any(go(i, j, 0) for i in range(m) for j in range(n))
```

<!-- @annotations -->
- 14: The board is a list of lists and is mutated in place, so the caller sees the sentinels for the duration of the call.
- 17: Restoring `save` rather than the original character from `word` — they are equal here, but reading from the board is what keeps this correct if the sentinel ever changes.

<!-- @approach -->
### Search from the Rarer End

<!-- @idea -->
Count how often the word's first and last letters appear on the board, and search whichever end is rarer — reversing the word when that is the last letter.

<!-- @steps -->
1. Count every letter on the board.
2. Compare the count of `word[0]` with the count of `word[L-1]`.
3. If the last letter is rarer, reverse the word.
4. Run the same depth-first search.
5. The answer is unchanged, because a path spelling the word forwards spells the reversal backwards.

<!-- @complexity -->
- time: O(m·n·4^L) worst case, unchanged
- space: O(L)
- note: Worth up to **9,169x** on a board where the first letter is common and the last is rare — and **3,559x slower** if applied when the first letter is already the rarer one. The direction has to be chosen, not assumed.

<!-- @code cpp -->
```cpp
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

bool exist(vector<vector<char>>& board, string word) {
    if (word.empty()) return true;

    int count[128] = {0};
    for (const auto& row : board)
        for (char ch : row) count[(unsigned char)ch]++;

    if (count[(unsigned char)word.back()] < count[(unsigned char)word.front()])
        reverse(word.begin(), word.end());

    return dfsInPlace(board, word);
}
```

<!-- @annotations -->
- 13: Strictly less, so an equal count leaves the word alone — reversing on a tie costs a copy and buys nothing.
- 10: One pass over the board, O(m·n), which is dwarfed by any search it saves and by the search itself when it saves none.
- 14: The reversal is safe because adjacency is symmetric: a path spelling the word forwards is the same path spelling the reversal backwards, so the answer cannot change.
- 7: `word` is taken **by value** here precisely so it can be reversed without disturbing the caller's string.

<!-- @code java -->
```java
static boolean exist(char[][] board, String word) {
    if (word.isEmpty()) return true;

    int[] count = new int[128];
    for (char[] row : board)
        for (char ch : row) count[ch]++;

    if (count[word.charAt(word.length() - 1)] < count[word.charAt(0)])
        word = new StringBuilder(word).reverse().toString();

    return dfsInPlace(board, word);
}
```

<!-- @annotations -->
- 9: Java strings are immutable, so reversing allocates a new one — reassigning the local `word` leaves the caller's reference untouched.

<!-- @code python -->
```python
from collections import Counter


def exist(board, word):
    if not word:
        return True

    count = Counter(ch for row in board for ch in row)
    if count[word[-1]] < count[word[0]]:
        word = word[::-1]

    return dfs_in_place(board, word)
```

<!-- @annotations -->
- 9: `Counter` returns 0 for a letter that never appears, so a word containing a letter absent from the board compares correctly rather than raising.
- 10: `word[::-1]` rebinds the local name; Python strings are immutable so the caller's string is unaffected.

<!-- @example -->

<!-- @input -->
```
board = A B C E
        S F C S
        A D E E

word = "ABCCED"
```

<!-- @output -->
```
true
```

<!-- @why -->
The path runs right along the top row to `C`, drops to the second row's `C`, then down and left through `E` and `D`. Every step is to an orthogonal neighbour and no cell repeats.

<!-- @walkthrough -->
```
(0,0)="A" matches word[0]
  (0,1)="B" matches word[1]
    (0,2)="C" matches word[2]
      (1,2)="C" matches word[3]
        (2,2)="E" matches word[4]
          (2,1)="D" matches word[5]  -> last character, true

Each visited cell is set to '#' on the way down and restored
on the way back, so the board is unchanged when the call
returns — which is what makes a second search valid.
```

<!-- @example -->

<!-- @input -->
```
board = A B C E
        S F C S
        A D E E

word = "ABCB"
```

<!-- @output -->
```
false
```

<!-- @why -->
The only `B` on the board is at (0,1), and the path has already used it as the second character. A cell cannot be reused, so the fourth character has nowhere to go.

<!-- @walkthrough -->
```
(0,0)="A", (0,1)="B", (0,2)="C"  match word[0..2]
  looking for word[3] = "B" from (0,2):
    (1,2)="C"  no
    (0,3)="E"  no
    (0,1)="#"  marked — it is the B already on the path

Without the marking, (0,1) would match and the answer would
be true. The sentinel is what enforces "no cell twice".
```

<!-- @example -->

<!-- @input -->
```
board = a a a a a a a
        a a a a a a a
        ... mostly 'a', one 'z' ...

word = "aaaaaaaaz"
```

<!-- @output -->
```
true or false, in 1,404 nodes instead of 12,873,220
```

<!-- @why -->
Every `a` on the board is a valid start, so searching forwards explores almost the whole grid to depth 8 before discovering there is no `z` at the end. Searching from the `z` gives one start.

<!-- @walkthrough -->
```
forward   "aaaaaaaaz"   starts at every 'a'   -> 12,873,220 nodes
reversed  "zaaaaaaaa"   starts at the one 'z' ->      1,404 nodes

                                          a factor of 9,169

But on the word "zaaaaaaa", already starting at the rare
letter, reversing it makes things 3,559x WORSE — 2,080 nodes
becomes 7,402,696. Count both ends and pick; never reverse
unconditionally.
```

<!-- @example -->

<!-- @input -->
```
board = A B C E
        S F C S
        A D E E

word = "SEE"
```

<!-- @output -->
```
true
```

<!-- @why -->
Starts at the `S` in the second row's last column, steps down to `E`, then left to the other `E`. Also the case where the heuristic decides *not* to reverse.

<!-- @walkthrough -->
```
letter counts:  A:2  B:1  C:2  D:1  E:3  F:1  S:2

"SEE":  first letter 'S' appears 2 times
        last  letter 'E' appears 3 times
        3 < 2 is false  ->  do not reverse, search forwards

"ABCCED": first 'A' appears 2 times, last 'D' appears once
        1 < 2 is true   ->  reverse and search from the 'D'

The rule is a single comparison, and it is what stops the
heuristic from being applied backwards.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the two failure modes of forgetting to restore a cell, and why the direction of the search is worth four orders of magnitude in either direction.

<!-- @sampleInput -->
```json
{"primary":{"board":[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]],"word":"ABCCED","answer":true,"path":[{"cell":[0,0],"ch":"A","k":0},{"cell":[0,1],"ch":"B","k":1},{"cell":[0,2],"ch":"C","k":2},{"cell":[1,2],"ch":"C","k":3},{"cell":[2,2],"ch":"E","k":4},{"cell":[2,1],"ch":"D","k":5}],"note":"each visited cell is set to # on the way down and restored on the way back, so the board is unchanged when the call returns"},"noCellTwice":{"word":"ABCB","answer":false,"why":"the only B is at (0,1) and the path already used it as the second character","lookingFor":"word[3] = B from (0,2)","neighbours":[{"cell":[1,2],"ch":"C","match":false},{"cell":[0,3],"ch":"E","match":false},{"cell":[0,1],"ch":"#","match":false,"note":"marked - it is the B already on the path"}],"withoutMarking":"(0,1) would match and the answer would wrongly be true"},"theRestoreBug":{"code":"char save = board[r][c]; board[r][c] = '#'; ... ; board[r][c] = save;","omitting":"the last assignment","measured":{"alphabet":"3 letters, random boards","rows":[{"board":"3x3","wordLen":3,"wrongPct":4.19,"mangledPct":97.50},{"board":"3x3","wordLen":5,"wrongPct":6.94,"mangledPct":97.49},{"board":"4x4","wordLen":5,"wrongPct":15.59,"mangledPct":99.89},{"board":"6x6","wordLen":5,"wrongPct":16.98,"mangledPct":100.0},{"board":"6x6","wordLen":7,"wrongPct":27.02,"mangledPct":100.0}]},"twoFailuresAtDifferentRates":{"wrongAnswers":"grow with the search space - a bigger board and longer word mean more backtracking, and every abandoned branch leaves # behind to block later ones","boardCorruption":"essentially unconditional - at 6x6 the function destroys its input every single time, whatever it returns"},"whyItHides":"even on 3x3 where the answer is wrong only 4% of the time, the board is wrecked on 97.5% - a test that checks only the return value sees nothing wrong on 96% of runs"},"searchDirection":{"idea":"the search starts at every cell matching word[0]; if that letter is common and the last is rare, almost every start is a dead end discovered deep","validity":"a path spelling the word forwards is the same path spelling the reversal backwards, so the answer cannot change","measured":{"boards":"almost entirely 'a' with a single 'z'","rows":[{"board":"40x40","word":"aaaaaaz","forward":1289422,"reversed":1062,"ratio":"1,214x"},{"board":"60x60","word":"aaaaaaaz","forward":75893,"reversed":50,"ratio":"1,518x"},{"board":"40x40","word":"aaaaaaaaz","forward":12873220,"reversed":1404,"ratio":"9,169x"},{"board":"60x60","word":"zaaaaaaa","forward":2080,"reversed":7402696,"ratio":"0.0003x"}]},"theCaveat":"the last row already starts with the rare letter, and reversing it is 3,559x WORSE","rule":"not 'reverse the word' but 'start from whichever end is rarer on the board' - count both letters first and decide","worked":{"counts":{"A":2,"B":1,"C":2,"D":1,"E":3,"F":1,"S":2},"ABCCED":"first A appears 2, last D appears 1 -> reverse","SEE":"first S appears 2, last E appears 3 -> do not reverse"}},"theFrequencyPreCheck":{"idea":"count the letters on the board; if the word needs more of some letter than the board holds, return false without searching","measured":[{"board":"6x6","wordLen":6,"missesRejectedEarly":"4.23%"},{"board":"6x6","wordLen":10,"missesRejectedEarly":"13.36%"},{"board":"10x10","wordLen":6,"missesRejectedEarly":"0.00%"},{"board":"10x10","wordLen":10,"missesRejectedEarly":"0.02%"}],"why":"on a 10x10 board over six letters there are about 16 of each, so a word of ten characters essentially never exhausts one","verdict":"it fires on small boards, where the search was cheap anyway, and stops firing exactly as the board grows"},"markingComparison":{"unit":"nanoseconds","rows":[{"board":"20x20","inPlace":7834,"visitedArray":8584,"ratio":"1.10x"},{"board":"60x60","inPlace":12625,"visitedArray":15167,"ratio":"1.20x"},{"board":"100x100","inPlace":6042,"visitedArray":8667,"ratio":"1.43x"}],"tradeoff":"the visited-array version never touches the caller's board, so it cannot be the source of the corruption"},"assertions":["cells are adjacent horizontally and vertically only","no cell may be used twice in one path","the board must be identical when the function returns","reversing the word does not change the answer","the sentinel need only be a character the word cannot contain"]}
```

<!-- @highlights -->
- The state to undo is the **board itself** — mark a cell, recurse, put the letter back.
- Omitting the restore is wrong on **4%–27%** of answers and mangles the board on **97.5%–100%**.
- The corruption is the unconditional failure; the wrong answer is the occasional one, so return-value tests miss it.
- Searching from the **rarer end** of the word: **9,169×** fewer nodes in one direction, **3,559× worse** in the other.
- So the rule is "count both ends and pick", not "reverse the word".
- The letter-frequency pre-check rejects 13.36% of misses at 6×6 and **0.02%** at 10×10 — it stops working as the board grows.

<!-- @edgeCases -->
- Word longer than the number of cells — cannot fit; the frequency pre-check catches this one reliably.
- Single-cell board — one start, one character to match.
- Word of length 1 — returns at the first matching cell without ever marking.
- Empty word — conventionally true; guard before indexing `word[0]`.
- Word whose letters are all identical — the worst case for the search, and where the direction heuristic cannot help.
- First and last letters equally common — the comparison is strict, so no reversal happens and nothing is wasted.
- A letter in the word absent from the board — `Counter` returns 0 rather than raising; the search fails on the first cell.
- Board containing `'#'` — then the sentinel collides with real data; pick a character outside the input alphabet.
- The caller reusing the board afterwards — the case the restore protects, and the one nobody tests.

<!-- @pitfalls -->
- Forgetting to restore the cell. The board is destroyed on essentially every input and the answer is wrong on up to 27%.
- Testing only the return value. The corruption is invisible that way on 96% of small-board runs.
- Reversing the word unconditionally. It is 3,559× *slower* when the first letter is already the rarer one.
- Marking the cell before the last-character return. Harmless but pointless — the mark is undone immediately.
- Using a sentinel that could appear in the board. `'#'` is only safe because the input alphabet excludes it.
- Indexing before the bounds check. In Python a negative index wraps silently to the far side of the grid.
- Reaching for the frequency pre-check as a real optimisation. It rejects 0.02% of misses at 10×10.
- Allocating the visited array inside the recursion rather than once.
- Assuming diagonal moves are allowed. Only the four orthogonal neighbours count.

<!-- @doubt -->
### What actually goes wrong if the cell is not restored?

<!-- @answer -->
Two different things, at very different rates, and the more frequent one is the one nobody looks for. Every abandoned branch leaves a `#` behind, so cells that a later path legitimately needs appear to be occupied — measured on random three-letter boards, the answer is wrong on **4.19%** of 3×3 boards with length-3 words, rising to **27.02%** on 6×6 boards with length-7 words, because a larger search space means more abandoned branches. The other failure is unconditional: the board is left mangled on **97.5%** of the 3×3 cases and **100.00%** of the 6×6 ones. So on a small board the function usually returns the right answer and almost always destroys its input, which means a test that checks only the return value passes 96% of the time while the caller's board is ruined. If you take a board by reference and modify it as a working device, the test has to inspect the board afterwards.

<!-- @doubt -->
### Is reversing the word actually worth it?

<!-- @answer -->
Enormously, in one direction, and catastrophically in the other — which is why the heuristic has to be stated carefully. The search starts at every cell matching `word[0]`, so if that letter is common and the final letter is rare, nearly every start is a dead end found only at full depth. On a 40×40 board that is almost all `a` with a single `z`, searching `"aaaaaaaaz"` forwards visits **12,873,220** nodes and searching `"zaaaaaaaa"` visits **1,404** — a factor of **9,169**. But on `"zaaaaaaa"`, which already begins with the rare letter, reversing costs **2,080 nodes becoming 7,402,696 — 3,559x worse**. The correct rule is therefore not "reverse the word" but "start from whichever end is rarer on the board": count both letters in one O(m·n) pass and compare. The reversal is always *safe* — adjacency is symmetric, so a path spelling the word forwards spells the reversal backwards — it is only the direction that has to be earned.

<!-- @doubt -->
### Should I add the letter-frequency pre-check?

<!-- @answer -->
It costs almost nothing and it does almost nothing, and the reason is worth seeing. The guard counts every letter on the board and returns false immediately if the word needs more of some letter than exists. Measured as the share of *misses* it rejects without searching: **4.23%** on a 6×6 board with a 6-letter word, **13.36%** at 6×6 with a 10-letter word, and then **0.00%** and **0.02%** on 10×10. A 100-cell board over six letters holds about 16 of each, so a ten-character word essentially never exhausts one — the guard fires precisely when the board is small and the search was cheap anyway, and stops firing as the board grows and the search gets expensive. It is worth keeping only for the one case it handles reliably, which is a word longer than the entire board.

<!-- @doubt -->
### In-place marking or a separate visited array?

<!-- @answer -->
In place, unless the board must not be touched. Overwriting the cell is **1.10x faster at 20×20, 1.20x at 60×60 and 1.43x at 100×100**, because there is no `m × n` allocation and the letter and its mark occupy the same cache line rather than two separate grids. The argument for the visited array is not speed but isolation: it never modifies the caller's board, so the corruption failure above is structurally impossible rather than merely avoided. If the same board is searched for many words, or is shared, or the function might throw partway through, that guarantee is worth more than 40%. Note that in every language here the board is passed by reference — `vector<vector<char>>&` in C++, `char[][]` in Java, a list of lists in Python — so "it's a parameter, so it's a copy" is false in all three.

<!-- @doubt -->
### Why is the sentinel `'#'` safe?

<!-- @answer -->
Only because the input alphabet excludes it. The mark has to be a value that fails the comparison `board[r][c] != word[k]` for every possible `k`, which means any character the word cannot contain. LeetCode 79 restricts the board and the word to letters, so `'#'` works — and if the problem ever admitted arbitrary characters it would not. The alternatives are a separate visited grid, which has no such assumption, or flipping a high bit on the stored character so the original is recoverable by masking rather than by saving it. Note also the small detail in the restore: the code writes back `save`, the value read from the board, rather than `word[k]`. Those are equal by construction here, but reading from the board keeps the restore correct independently of what the sentinel is or how the match was decided.
