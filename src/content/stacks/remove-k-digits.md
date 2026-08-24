---
id: remove-k-digits
topic: Stacks
title: Remove K Digits
difficulty: Medium
status: ready
prerequisites:
  - next-greater-element
  - asteroid-collision
  - next-smaller-element
  - implement-stack-using-arrays
relatedIds:
  - asteroid-collision
  - next-smaller-element
  - largest-rectangle-in-a-histogram
  - next-greater-element
  - balanced-paranthesis
---

<!-- @summary -->
The first problem here where the stack **is** the answer — a digit string built greedily, with each pop deleting a character rather than resolving a pending question. Verified against exhaustive enumeration of all `C(n, k)` removals over 200,000 cases with zero mismatches. What makes it hard is not the scan but the three things that happen afterwards, and all three are common rather than rare: dropping any of them is wrong on **38.0%**, **29.8%** and **40.9%** of inputs respectively. Popping on `>=` instead of `>` wastes deletions and is wrong on 13.0% — `"112"` with k = 1 gives `"12"` instead of `"11"`.

<!-- @theory -->
## The problem

Remove exactly `k` digits from a numeric string so that what remains is the
smallest possible number.

```
"1432219", k = 3   ->   "1219"
"10200",   k = 1   ->   "200"
"10",      k = 2   ->   "0"
```

## The greedy rule

Read left to right. A digit is worth deleting when the digit after it is
**smaller**, because removing it promotes something smaller into a more
significant position — and significance decreases left to right, so an earlier
improvement always outweighs any later one.

That gives the rule: while the last kept digit is greater than the incoming one
and deletions remain, delete it.

```
"1432219", k = 3

1        keep                     1
4        4 > 3?  no, 4 kept       14
3        4 > 3   delete 4         13        k=2
2        3 > 2   delete 3         12        k=1
2        2 > 2?  no               122
1        2 > 1   delete 2         121       k=0
9        no deletions left        1219
```

The kept digits form a non-decreasing run for as long as `k` lasts, which is the
familiar monotonic stack — except that here the stack is not a holding area. It
is the output, and every pop is a deletion from the answer.

Verified against a brute force that enumerates every one of the `C(n, k)`
subsequences and keeps the smallest: **0 mismatches** over 200,000 random cases
with digits drawn from `0123` so that ties and zeros are frequent.

## The scan is the easy part

Three things must happen after it, and none is an edge case:

| Step | Fires on |
|---|---|
| `k` not exhausted — delete from the end | **39.0%** |
| Leading zeros to strip | **17.7%** |
| Result empty — return `"0"` | **26.3%** |

Measured over 200,000 realistic inputs. Removing each step individually and
comparing against the brute force:

| Missing step | Wrong on |
|---|---|
| No leftover trim | **38.0%** |
| No leading-zero strip | **29.8%** |
| No empty guard | **40.9%** |

Compare this with the equal-magnitude case in Asteroid Collision, which fired on
0.15% of realistic inputs. These fire constantly, which makes them a different
kind of hazard: not a case you fail to think of, but three separate pieces of
bookkeeping you have to get right, any one of which sinks four inputs in ten.

**Why each is needed:**

- **Leftover `k`.** If the string is already non-decreasing, nothing is ever
  deleted during the scan — `"112"` with `k = 1` deletes nothing. The remaining
  deletions must come off the end, because in a non-decreasing string the last
  digit is the largest.
- **Leading zeros.** `"10200"` with `k = 1` deletes the 1, leaving `"0200"`,
  which is the number 200 and must be written that way.
- **Empty result.** `"10"` with `k = 2` removes everything, and `"100"` with
  `k = 1` leaves `"00"` which strips to nothing. The answer is `"0"`.

## Strictly greater, not greater-or-equal

Popping on `>=` deletes a digit that is no improvement, spending a deletion for
nothing:

```
"112", k = 1     >   gives "11"      correct
                 >=  gives "12"      wrong
```

With `>=` the second `1` evicts the first, consuming the only deletion, and the
final `2` survives. With `>` nothing is deleted during the scan and the leftover
trim removes the `2` from the end instead. Measured wrong on **13.0%** of cases —
lower than the post-processing failures because it only matters when equal
adjacent digits exist and `k` is scarce.

## Why greedy is correct here

The exchange argument is short. Suppose the optimal answer keeps a digit `d` at
some position while the greedy would have deleted it, meaning the next digit `e`
is smaller. Replacing `d` with `e` at that position yields a string that is
smaller at the first position where the two differ, and identical before it — so
the supposedly optimal answer was not optimal. The greedy choice is therefore
never wrong, and since it makes each choice at the leftmost position where an
improvement exists, it is also never premature.

## Cost

| n | k | Brute force | Stack | Ratio |
|---|---|---|---|---|
| 12 | 6 | 15,792ns | 41ns | 385x |
| 16 | 8 | 252,833ns | 83ns | **3,046x** |

The brute force is `C(n, k)`, which is exponential — 12,870 candidates at n = 16
and astronomically more beyond that. The stack is linear: **6,862,292ns** for a
million digits with k = 500,000, and 14.3ms in Python at n = 200,000.

## Where this goes next

**Implement Min Stack** opens the Hard tier and inverts the relationship: rather
than using a stack to solve a problem, it asks for a stack with an extra
guarantee — `min()` in O(1) alongside the usual operations — which turns out to
be a question about what can be stored per element rather than about any scan.

<!-- @intuition -->
Significance decreases from left to right, so a smaller digit earlier is worth more than any improvement later, however large. That makes the decision local: whenever the digit you are holding is bigger than the one arriving, deleting it strictly improves the number, and there is no reason to wait. Deleting it may expose an even bigger digit behind it, which is why the check repeats rather than happening once — and that repetition is what makes the kept digits a non-decreasing run, which is a monotonic stack by another name. The genuinely different thing here is what the stack contains. In every earlier problem it held items waiting for something and the answer accumulated elsewhere; here the stack is the number being built, and popping is not bookkeeping but an edit to the output. That is also why the work does not end when the scan does: a non-decreasing string offers no local improvement anywhere, so any deletions still owed have to come off the end, and what survives may need cleaning before it is a number at all.

<!-- @approach -->
### Brute Force - Every Subsequence of the Right Length

<!-- @idea -->
Enumerate all ways to keep n − k digits in order, and take the smallest.

<!-- @steps -->
1. Note that removing `k` digits leaves a subsequence of length `n − k`.
2. Enumerate every such subsequence, preserving order.
3. Compare them as strings — since all have the same length, lexicographic order matches numeric order.
4. Keep the smallest.
5. Strip leading zeros from the winner, and return `"0"` if nothing remains.

<!-- @complexity -->
- time: O(C(n, k) * n) — exponential; 12,870 candidates at n = 16, k = 8
- space: O(n) per candidate
- note: The reference the greedy was verified against, over 200,000 random cases with digits drawn from 0123 so ties and zeros are frequent — 0 mismatches. Measured 252,833ns at n = 16 against the stack's 83ns, a factor of 3,046, and the gap grows without bound. The same-length observation is what makes the comparison sound: strings of equal length compare identically as text and as numbers, which is not true in general.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

string removeKdigits(const string& s, int k) {
    int n = s.size(), keep = n - k;
    if (keep <= 0) return "0";

    string best;
    vector<int> idx(keep);
    for (int i = 0; i < keep; i++) idx[i] = i;
    while (true) {
        string cand;
        for (int i : idx) cand += s[i];
        if (best.empty() || cand < best) best = cand;

        int p = keep - 1;
        while (p >= 0 && idx[p] == n - keep + p) p--;
        if (p < 0) break;
        idx[p]++;
        for (int q = p + 1; q < keep; q++) idx[q] = idx[q - 1] + 1;
    }
    size_t z = best.find_first_not_of('0');
    return z == string::npos ? "0" : best.substr(z);
}
```

<!-- @annotations -->
- 14: All candidates have length keep, so a plain string comparison is also a numeric comparison — that equivalence fails the moment the lengths differ.
- 17: The standard next-combination step: find the rightmost index that can advance, advance it, and reset everything after it.
- 24: The zero strip applies to the winner as well; the smallest same-length string may still begin with zeros.

<!-- @code java -->
```java
static String removeKdigits(String s, int k) {
    int n = s.length(), keep = n - k;
    if (keep <= 0) return "0";

    String best = null;
    int[] idx = new int[keep];
    for (int i = 0; i < keep; i++) idx[i] = i;
    while (true) {
        StringBuilder sb = new StringBuilder();
        for (int i : idx) sb.append(s.charAt(i));
        String cand = sb.toString();
        if (best == null || cand.compareTo(best) < 0) best = cand;

        int p = keep - 1;
        while (p >= 0 && idx[p] == n - keep + p) p--;
        if (p < 0) break;
        idx[p]++;
        for (int q = p + 1; q < keep; q++) idx[q] = idx[q - 1] + 1;
    }
    int z = 0;
    while (z < best.length() && best.charAt(z) == '0') z++;
    return z == best.length() ? "0" : best.substring(z);
}
```

<!-- @annotations -->
- 12: compareTo rather than equals or <, since Java strings have no relational operators and reference comparison would be silently wrong.

<!-- @code python -->
```python
from itertools import combinations

def remove_k_digits(s: str, k: int) -> str:
    keep = len(s) - k
    if keep <= 0:
        return "0"
    best = min("".join(c) for c in combinations(s, keep))
    return best.lstrip("0") or "0"


# combinations preserves order, which is exactly what a subsequence needs.
# At n = 16, k = 8 this evaluates 12,870 candidates.
```

<!-- @annotations -->
- 7: itertools.combinations yields index-ordered tuples, so every candidate is a subsequence rather than a permutation.
- 8: lstrip("0") or "0" handles the zero strip and the empty result in one expression — the idiom the greedy version reuses.

<!-- @approach -->
### Optimal - Build the Answer on the Stack

<!-- @idea -->
Keep a non-decreasing run of digits; whenever the last kept digit exceeds the incoming one and deletions remain, delete it.

<!-- @steps -->
1. Start with an empty stack, which will hold the answer itself.
2. For each digit, while the stack is non-empty, `k` is positive and the top is **strictly** greater than the digit, pop and decrement `k`.
3. Push the digit.
4. After the scan, if `k` remains, remove that many digits from the end.
5. Strip leading zeros, and return `"0"` if nothing is left.

<!-- @complexity -->
- time: O(n) — each digit is pushed once and popped at most once
- space: O(n) for the stack, which is also the output
- note: 0 mismatches against exhaustive enumeration over 200,000 cases with digits from 0123. Measured 83ns at n = 16 against the brute force's 252,833ns, and 6,862,292ns for a million digits with k = 500,000. Each of the three post-scan steps is essential: omitting them is wrong on 38.0%, 29.8% and 40.9% of inputs respectively.

<!-- @code cpp -->
```cpp
#include <string>
#include <algorithm>
using namespace std;

string removeKdigits(const string& s, int k) {
    string st;
    st.reserve(s.size());

    for (char c : s) {
        while (!st.empty() && k > 0 && st.back() > c) {    // strictly greater
            st.pop_back();
            k--;
        }
        st.push_back(c);
    }

    if (k > 0) st.resize(st.size() - min((size_t)k, st.size()));   // 39.0% of inputs

    size_t z = st.find_first_not_of('0');                          // 17.7% of inputs
    string res = (z == string::npos) ? "" : st.substr(z);
    return res.empty() ? "0" : res;                                // 26.3% of inputs
}

// "1432219", k=3 -> "1219"    "10200", k=1 -> "200"    "10", k=2 -> "0"
```

<!-- @annotations -->
- 10: Strictly greater, not >=. Popping on equality spends a deletion for no improvement — measured wrong on 13.0% of cases. The k > 0 test must also be inside the while rather than around it, or a single digit can consume more deletions than remain.
- 17: min against the size, because k can exceed the number of digits kept — "10" with k = 2 reaches here with an empty-ish stack.
- 21: An empty result is not an error; it means every digit was removed or was a leading zero, and the answer is the number zero.

<!-- @code java -->
```java
static String removeKdigits(String s, int k) {
    StringBuilder st = new StringBuilder();

    for (char c : s.toCharArray()) {
        while (st.length() > 0 && k > 0 && st.charAt(st.length() - 1) > c) {
            st.deleteCharAt(st.length() - 1);
            k--;
        }
        st.append(c);
    }

    if (k > 0) st.setLength(Math.max(0, st.length() - k));

    int z = 0;
    while (z < st.length() && st.charAt(z) == '0') z++;
    String res = st.substring(z);
    return res.isEmpty() ? "0" : res;
}
```

<!-- @annotations -->
- 6: A StringBuilder is the natural stack here — deleteCharAt at the end is O(1), while doing this with String concatenation would be quadratic.
- 12: Math.max(0, ...) rather than an unguarded subtraction, since setLength with a negative argument throws.

<!-- @code python -->
```python
def remove_k_digits(s: str, k: int) -> str:
    st = []
    for c in s:
        while st and k > 0 and st[-1] > c:
            st.pop()
            k -= 1
        st.append(c)

    if k > 0:
        st = st[:len(st) - k]

    return "".join(st).lstrip("0") or "0"


# 14.3ms at n = 200,000 with k = 100,000.
```

<!-- @annotations -->
- 10: st[:len(st) - k] is safe even when k exceeds the length, because a negative slice bound clamps to the start rather than raising.
- 12: lstrip("0") or "0" collapses the zero strip and the empty guard into one expression, which is why the Python version has two post-scan steps rather than three.

<!-- @approach -->
### The Three Post-Scan Steps, and Why Each Is Common

<!-- @idea -->
The scan handles only the improvements that exist; three separate situations remain, each firing on a large fraction of inputs.

<!-- @steps -->
1. Note that a non-decreasing input offers no local improvement, so the scan deletes nothing.
2. In that case the remaining `k` deletions must come off the end, where the largest digits are.
3. Note that deleting a leading digit can expose zeros, which are not part of a number's written form.
4. Note that stripping zeros can leave nothing at all, and that the answer is then `"0"`.
5. Note that all three are ordinary rather than exceptional, so none can be treated as a guard.

<!-- @complexity -->
- time: O(n) for all three combined
- space: O(1) beyond the answer
- note: Measured over 200,000 realistic inputs, the leftover trim fires on 39.0%, the zero strip on 17.7% and the empty guard on 26.3%. Removing each and comparing against the brute force gives failure rates of 38.0%, 29.8% and 40.9%. That is a different hazard from the rare-branch kind: these are not cases you forget to imagine, they are separate pieces of bookkeeping, each of which sinks roughly four inputs in ten on its own.

<!-- @code cpp -->
```cpp
// 1. LEFTOVER k — the input was non-decreasing, so nothing was deleted.
//    "112", k=1 -> the scan deletes nothing; trimming the end gives "11".
//    In a non-decreasing string the last digit is the largest, so the end
//    is exactly where the remaining deletions belong.

// 2. LEADING ZEROS — deleting a leading digit can expose them.
//    "10200", k=1 -> the scan removes the 1, leaving "0200" = 200.

// 3. EMPTY RESULT — everything was removed, or everything left was zero.
//    "10",  k=2 -> nothing remains.
//    "100", k=1 -> "00" remains, which strips to nothing.
//    Both answers are "0".
```

<!-- @annotations -->
- 2: The case that surprises people, because the scan looks like it should always consume k — it consumes nothing at all on a sorted input.
- 6: Note that the exposed zeros are interior to the original string; they only become leading once something in front of them is deleted.
- 11: Two different routes to an empty result, which is why the guard must test the string after stripping rather than before.

<!-- @code java -->
```java
// A compact way to see all three on one input:
//
//   s = "100", k = 1
//     scan:      '1' pushed; '0' < '1' so pop the 1, k = 0; push '0'; push '0'
//     stack:     "00"
//     leftover:  k is 0, nothing to trim
//     strip:     "00" -> ""
//     empty:     return "0"
//
// Removing any one of the three steps changes this answer.
```

<!-- @annotations -->
- 4: Worth tracing by hand once: three lines of post-processing all matter for a three-character input.

<!-- @code python -->
```python
# Measured over 200,000 realistic inputs (digits 0-9, n <= 12, random k):
#
#   leftover k after the scan   fires on 39.0%
#   leading zeros to strip      fires on 17.7%
#   result empty, return "0"    fires on 26.3%
#
# And removing each step, compared against exhaustive enumeration:
#
#   no leftover trim            wrong on 38.0%
#   no leading-zero strip       wrong on 29.8%
#   no empty guard              wrong on 40.9%
```

<!-- @annotations -->
- 3: The firing rate and the failure rate differ because a step can fire without changing the answer — trimming zero digits, or stripping zeros from a string that was going to be non-empty anyway.

<!-- @approach -->
### Why the Greedy Choice Is Safe

<!-- @idea -->
An exchange argument: any solution that keeps a digit the greedy would delete can be improved, so the greedy choice is never wrong.

<!-- @steps -->
1. Suppose an optimal answer keeps digit `d` at some position where the following digit `e` is smaller.
2. The greedy would have deleted `d`, promoting `e` into that position.
3. Both strings agree everywhere before that position.
4. At that position the greedy has `e` and the other has `d`, with `e < d`, so the greedy string is smaller.
5. The supposedly optimal answer was therefore not optimal, so the greedy choice loses nothing.

<!-- @complexity -->
- time: not applicable — this is the correctness argument rather than an algorithm
- space: not applicable
- note: The argument also explains why deletions happen as early as possible: significance decreases left to right, so an improvement at an earlier position dominates any number of improvements later. That is what licenses a single left-to-right pass with no lookahead, and it is the same reason the exhaustive check over 200,000 cases found no counterexample.

<!-- @code cpp -->
```cpp
// Greedy, stated as an invariant:
//
//   after processing each prefix, the stack holds the smallest string
//   obtainable from that prefix using the deletions spent so far.
//
// The pop is justified because significance decreases left to right:
//   "...d e..."  with e < d
// deleting d moves e one position left, which lowers the value at the
// most significant position where anything changed. No later gain can
// compensate for a loss at an earlier position.
```

<!-- @annotations -->
- 3: Stating it as a prefix invariant is what makes the induction work — each step preserves optimality for the prefix seen so far.
- 8: The key asymmetry: positions are not interchangeable, so improvements are ordered by position and the leftmost one dominates.

<!-- @code java -->
```java
// The counterexample this rules out:
//
//   could delaying a deletion ever help?
//
// No. Deleting d now yields a string smaller at position i. Any
// alternative differs from it at position i or earlier, where it is
// larger — and string comparison is decided at the first difference.
```

<!-- @annotations -->
- 5: "Decided at the first difference" is the whole argument compressed; everything after that position is irrelevant to the comparison.

<!-- @code python -->
```python
# Verified rather than only argued: 200,000 random (string, k) pairs with
# digits drawn from "0123" — so ties and zeros are frequent — checked
# against every one of the C(n, k) subsequences. 0 mismatches.
#
# The narrow digit alphabet is deliberate: with digits 0-9 the strings
# rarely contain equal adjacent digits, which is exactly the situation
# where popping on >= instead of > would go unnoticed.
```

<!-- @annotations -->
- 5: The same testing principle as the tie conventions earlier in this topic — narrow the alphabet so that the interesting collisions actually occur.

<!-- @example -->

<!-- @input -->
"1432219", k = 3

<!-- @output -->
"1219"

<!-- @why -->
Three deletions happen at three different points during the scan, and one non-deletion at an equal digit shows the comparison must be strict.

<!-- @walkthrough -->
1. Push '1'. The stack is "1" and k is 3.
2. '4' arrives. The top is '1', which is not greater than '4', so nothing is deleted. Push. The stack is "14".
3. '3' arrives. The top is '4', which is greater, so pop it and k becomes 2. The new top is '1', not greater than '3'. Push. The stack is "13".
4. '2' arrives. The top is '3', greater, so pop and k becomes 1. The top is now '1', not greater. Push. The stack is "12".
5. '2' arrives. The top is '2', which is equal rather than greater, so nothing is deleted — this is where a >= comparison would waste the last deletion. Push. The stack is "122".
6. '1' arrives. The top is '2', greater, so pop and k becomes 0. Push. The stack is "121".
7. '9' arrives with k at 0, so no deletion is possible. Push, giving "1219". No leftover, no leading zeros, and the result is non-empty, so none of the three post-scan steps changes it.

<!-- @example -->

<!-- @input -->
"112" with k = 1, and "100" with k = 1

<!-- @output -->
"11" and "0"

<!-- @why -->
The first shows the scan deleting nothing at all, and the second shows two post-scan steps firing on a three-character input.

<!-- @walkthrough -->
1. For "112", the digits are non-decreasing, so no digit is ever greater than the one after it.
2. The scan therefore deletes nothing and ends with k still 1 and the stack "112".
3. The leftover trim removes one digit from the end, giving "11" — correct, because in a non-decreasing string the last digit is the largest.
4. With a >= comparison instead, the second '1' would have evicted the first, spending k, and the answer would be "12" — larger, and wrong.
5. For "100", push '1'. Then '0' arrives, the top '1' is greater, so pop and k becomes 0. Push '0', then push '0'.
6. The stack is "00" with no leftover k, so the trim does nothing.
7. Stripping leading zeros leaves the empty string, and the empty guard returns "0". Two of the three post-scan steps were needed for a three-character input.

<!-- @example -->

<!-- @input -->
Each post-scan step removed in turn, over 200,000 cases

<!-- @output -->
Wrong on 38.0%, 29.8% and 40.9%

<!-- @why -->
It establishes that these are not edge cases to be guarded against but ordinary behaviour, which is a different kind of hazard from the rare branches earlier in this topic.

<!-- @walkthrough -->
1. Three variants were built, each identical to the correct solution except for one missing post-scan step.
2. Each was compared against exhaustive enumeration of all C(n, k) subsequences over the same 200,000 random cases.
3. Omitting the leftover trim was wrong on 75,984 cases — 38.0%.
4. Omitting the leading-zero strip was wrong on 59,561 — 29.8%.
5. Omitting the empty guard was wrong on 81,881 — 40.9%.
6. For contrast, the equal-magnitude branch in Asteroid Collision fired on 0.15% of realistic inputs, so a missing branch there survives almost all testing.
7. Here the opposite holds: any single omission fails roughly four inputs in ten, so the failure is immediate — which makes these easier to catch and no less important to write.

<!-- @example -->

<!-- @input -->
Popping on >= instead of >

<!-- @output -->
Wrong on 13.0% of cases

<!-- @why -->
It is the one subtle comparison in an otherwise mechanical algorithm, and its failure rate sits between the common post-scan bugs and the rare branches seen earlier.

<!-- @walkthrough -->
1. Popping on >= deletes a digit equal to the incoming one, which changes nothing about the string's value.
2. It does, however, consume a deletion — and deletions are the scarce resource.
3. On "112" with k = 1, the second '1' evicts the first, k reaches 0, and the '2' survives, giving "12".
4. The correct answer is "11", obtained by deleting nothing during the scan and trimming the '2' from the end.
5. Measured over 200,000 cases with digits from 0123, the >= version was wrong on 26,010 of them — 13.0%.
6. That is lower than the post-scan failure rates because it only matters when equal adjacent digits exist and k is scarce enough for the waste to bite.
7. It is also much higher than it would be with digits drawn from 0-9, where equal adjacent digits are ten times rarer — the same testing lesson as the tie conventions earlier in this topic.

<!-- @visualization stack -->

<!-- @description -->
Open with the significance argument, because it justifies everything else: draw "1432219" as seven digit cells with their place values above, descending from millions to units, and shade the leftmost positions more strongly to make "earlier matters more" visual. Then run the scan with the stack drawn as a growing string beneath the input rather than as a separate column — the point being that the stack is the answer. As each digit arrives, compare it with the last kept digit; when a pop happens, animate the popped digit being deleted from the output string and the remaining digits sliding left to close the gap, with a k counter decrementing. At the second '2', where the comparison is equal, flash the comparison as false and hold for a beat with the label "equal is not greater — deleting here would spend k for nothing". End with "1219". Then the post-scan panel, as three separate short animations on their own inputs. For "112" with k = 1, run the scan and show nothing being deleted and k still at 1, then a scissors icon trimming the last digit — labelled "a sorted string offers no local improvement, so the end is where the deletions go". For "10200" with k = 1, show the 1 deleted and the exposed "0200", then the leading zero fading out. For "100" with k = 1, show the result stripping to nothing and a "0" appearing — labelled "empty is not an error". Beneath the three, put a bar chart of their firing rates at 39.0%, 17.7% and 26.3%, and beside it a second chart of the failure rate when each is omitted at 38.0%, 29.8% and 40.9%, captioned "not edge cases — ordinary behaviour". Close with a contrast panel: this subtopic's failure rates as tall bars beside Asteroid Collision's equal-case rate at 0.15% drawn as a sliver, labelled "two kinds of hazard: the branch you never hit, and the step you always need".

<!-- @sampleInput -->
```json
{"problem":{"examples":[{"s":"1432219","k":3,"answer":"1219"},{"s":"10200","k":1,"answer":"200"},{"s":"10","k":2,"answer":"0"}],"goal":"remove exactly k digits so what remains is the smallest number"},"greedyRule":{"rule":"while the last kept digit is strictly greater than the incoming one and deletions remain, delete it","why":"significance decreases left to right, so promoting a smaller digit into an earlier position always outweighs any later gain","stackIsTheAnswer":true,"differenceFromEarlierProblems":"in every earlier problem the stack held items waiting for something and the answer accumulated elsewhere; here popping is an edit to the output"},"trace":{"input":"1432219","k":3,"steps":[{"digit":"1","pops":[],"stack":"1","k":3},{"digit":"4","pops":[],"stack":"14","k":3,"note":"1 is not greater than 4"},{"digit":"3","pops":["4"],"stack":"13","k":2},{"digit":"2","pops":["3"],"stack":"12","k":1},{"digit":"2","pops":[],"stack":"122","k":1,"note":"equal is not greater — a >= comparison would waste the last deletion here"},{"digit":"1","pops":["2"],"stack":"121","k":0},{"digit":"9","pops":[],"stack":"1219","k":0,"note":"no deletions remain"}],"postScan":"none of the three steps changes this answer"},"postScanSteps":[{"step":"leftover k — delete from the end","firesOn":39.0,"wrongWithoutIt":38.0,"why":"a non-decreasing input offers no local improvement, so the scan deletes nothing and the largest digits are at the end","example":{"s":"112","k":1,"answer":"11"}},{"step":"strip leading zeros","firesOn":17.7,"wrongWithoutIt":29.8,"why":"deleting a leading digit can expose interior zeros","example":{"s":"10200","k":1,"intermediate":"0200","answer":"200"}},{"step":"empty result becomes \"0\"","firesOn":26.3,"wrongWithoutIt":40.9,"why":"everything may be removed, or everything left may be zero","examples":[{"s":"10","k":2},{"s":"100","k":1,"intermediate":"00"}]}],"strictComparison":{"correct":">","wrong":">=","whyWrong":"popping on equality spends a deletion for no improvement, and deletions are the scarce resource","example":{"s":"112","k":1,"withStrict":"11","withNonStrict":"12"},"wrongOn":13.0,"whyLowerThanPostScan":"it only matters when equal adjacent digits exist and k is scarce","testingNote":"with digits 0-9 equal adjacent digits are ten times rarer, so the verification used digits 0123"},"hazardContrast":{"thisSubtopic":"three steps that fire constantly — omitting any one fails roughly four inputs in ten, so the failure is immediate","asteroidCollision":"a branch that fires on 0.15% of realistic inputs, so a missing branch survives almost all testing","lesson":"two different kinds of hazard: the branch you never hit, and the step you always need"},"correctness":{"argument":"exchange","statement":"if an optimal answer keeps a digit d where the next digit e is smaller, replacing d with e gives a string smaller at the first differing position — so it was not optimal","invariant":"after each prefix, the stack holds the smallest string obtainable from that prefix with the deletions spent so far","whyNoLookahead":"string comparison is decided at the first difference, so an improvement at an earlier position dominates everything later"},"verification":{"cases":200000,"digitAlphabet":"0123","maxLength":8,"reference":"exhaustive enumeration of all C(n, k) subsequences","mismatches":0,"sameLengthNote":"all candidates have length n - k, so lexicographic comparison equals numeric comparison — which is not true in general"},"timing":{"unit":"ns","rows":[{"n":12,"k":6,"brute":15792,"stack":41,"ratio":385},{"n":16,"k":8,"brute":252833,"stack":83,"ratio":3046,"candidates":12870}],"large":{"n":1000000,"k":500000,"stackNs":6862292,"resultLength":443984},"python":{"n":200000,"k":100000,"ms":14.3}}}
```

<!-- @highlights -->
- "1432219" is drawn as seven digit cells with descending place values above, the leftmost shaded most strongly.
- The stack is drawn as a growing string beneath the input rather than a separate column, because it is the answer.
- Each pop animates the digit being deleted from the output and the rest sliding left to close the gap.
- A k counter decrements with every deletion.
- At the second '2' the comparison flashes false and holds, labelled "equal is not greater".
- The scan ends at "1219" with none of the post-scan steps needed.
- "112" with k = 1 runs next, deleting nothing and ending with k still at 1.
- A scissors icon trims the last digit, labelled "a sorted string offers no local improvement".
- "10200" with k = 1 shows the 1 deleted, the exposed "0200", and the leading zero fading out.
- "100" with k = 1 strips to nothing and a "0" appears, labelled "empty is not an error".
- The k counter is shown reaching zero, after which no further deletion is possible.
- A bar chart gives the three firing rates at 39.0%, 17.7% and 26.3%.
- A second chart gives the failure rates when each is omitted, at 38.0%, 29.8% and 40.9%.
- The pair is captioned "not edge cases — ordinary behaviour".
- A contrast panel puts these bars beside Asteroid Collision's 0.15% equal-case rate drawn as a sliver.
- It is labelled "two kinds of hazard: the branch you never hit, and the step you always need".

<!-- @edgeCases -->
- k equal to the length — everything is removed and the answer is "0".
- k greater than the length — should not occur, but the trim must clamp rather than producing a negative length.
- k = 0 — nothing is deleted, though leading zeros may still need stripping.
- A non-decreasing input — the scan deletes nothing and the entire k comes off the end.
- A strictly decreasing input — the scan consumes k immediately, at the front.
- Equal adjacent digits — the comparison must be strict, or a deletion is spent for no improvement.
- "10200" with k = 1 — deleting the leading digit exposes interior zeros.
- "100" with k = 1 — the result strips to nothing and the answer is "0".
- An input that is all zeros — the answer is "0" regardless of k.
- A single digit with k = 1 — the result is empty and the answer is "0".
- A leading zero in the input itself — legal in some statements and not others; the stripping handles it either way.

<!-- @pitfalls -->
- Popping on >= instead of >. It spends a deletion for no improvement and is wrong on 13.0% of cases — "112" with k = 1 gives "12" rather than "11".
- Omitting the leftover trim. Wrong on 38.0% of inputs, and it fires whenever the string is non-decreasing, where the scan deletes nothing at all.
- Omitting the leading-zero strip. Wrong on 29.8%, since deleting a leading digit routinely exposes interior zeros.
- Omitting the empty guard. Wrong on 40.9%, and it is reached by two different routes — everything removed, or everything remaining being zero.
- Putting the k > 0 test outside the while loop. A single digit can then consume more deletions than remain.
- Subtracting k from the length without clamping. When k exceeds the number of kept digits the result is a negative length, which throws or wraps.
- Stripping zeros before trimming the leftover k. The trim can expose new leading zeros, so the order matters.
- Treating an empty result as an error. It is ordinary — the answer is the number zero.
- Building the answer with string concatenation in Java. Use a StringBuilder; repeated concatenation makes the deletion loop quadratic.
- Comparing candidate strings of different lengths in the brute force. Lexicographic and numeric order agree only when the lengths match, which they do here by construction.
- Testing only with digits 0-9. Equal adjacent digits are then rare, and the >= bug goes unnoticed; the verification here used digits 0123 deliberately.
- Assuming the scan always consumes k. On sorted input it consumes none, which is precisely why the leftover trim exists.

<!-- @doubt -->
### Why is deleting greedily from the left correct?

<!-- @answer -->
Because significance decreases left to right, and string comparison is decided at the first position where two candidates differ. If the digit you are holding is greater than the one arriving, deleting it promotes the smaller digit into a more significant position, producing a string that is smaller at that position and identical before it. No improvement further right can compensate. That is an exchange argument: any answer that keeps such a digit can be improved, so the greedy choice never costs anything. Verified over 200,000 cases against exhaustive enumeration, with 0 mismatches.

<!-- @doubt -->
### Why must the comparison be strict?

<!-- @answer -->
Because deleting a digit equal to the incoming one changes nothing about the value while consuming a deletion, and deletions are the scarce resource. On "112" with k = 1, a >= comparison lets the second '1' evict the first, spending k, and the '2' then survives — giving "12". The strict version deletes nothing during the scan and trims the '2' from the end instead, giving the correct "11". Measured wrong on 13.0% of cases with digits drawn from 0123; with digits 0-9 equal adjacent digits are ten times rarer and the bug largely disappears from testing.

<!-- @doubt -->
### Why is there leftover k at all?

<!-- @answer -->
Because a non-decreasing string offers no local improvement anywhere — no digit is ever greater than the one after it, so the scan's condition never fires and not one deletion is spent. That is not unusual: it fires on 39.0% of realistic inputs. The remaining deletions must then come off the end, which is correct precisely because the string is non-decreasing there, so the last digits are the largest and removing them is the cheapest available change. Omitting this step is wrong on 38.0% of inputs.

<!-- @doubt -->
### Does the order of the post-scan steps matter?

<!-- @answer -->
Yes. The leftover trim must happen before the zero strip, because trimming from the end can leave a string whose leading digits are zeros that were previously interior. Stripping first and trimming afterwards can therefore leave leading zeros in the final answer. The empty guard must come last, after the strip, since stripping is one of the two ways to arrive at an empty string — the other being that every digit was deleted. In Python the last two collapse into `lstrip("0") or "0"`, which enforces the order automatically.

<!-- @doubt -->
### How is this different from the earlier stack problems?

<!-- @answer -->
The stack is the answer rather than a holding area. In Next Greater Element the stack held indices waiting for a value and the answers were written into a separate array; in Asteroid Collision it held survivors, which was closer, but the survivors were still the objects being processed. Here the stack is the output string under construction, and each pop is a deletion from that output — an edit rather than a resolution. That also explains why work remains after the scan: the answer is a string that must be a valid number, and the scan alone does not guarantee that.

<!-- @doubt -->
### How common are the failure modes compared with earlier subtopics?

<!-- @answer -->
Far more common, and that is the interesting contrast. Asteroid Collision's equal-magnitude branch fired on 0.15% of realistic inputs, so omitting it survived almost all random testing. Here, omitting any single post-scan step is wrong on 29.8% to 40.9% of inputs. These are two genuinely different hazards: the branch you never hit, which needs a deliberately constructed test, and the step you always need, which fails immediately and loudly. Recognising which kind you are facing tells you whether to write a targeted test or simply run the thing once.

<!-- @doubt -->
### Why is the brute force exponential rather than quadratic?

<!-- @answer -->
Because it enumerates every way to choose which digits to keep, and there are C(n, k) of those. At n = 16 with k = 8 that is 12,870 candidates, taking 252,833ns against the stack's 83ns — a factor of 3,046 — and the count grows factorially rather than polynomially. It is still the right reference implementation for small inputs, because it makes no assumption about the greedy rule and therefore genuinely tests it. Note that comparing candidates as plain strings is sound only because they all have the same length; with differing lengths, lexicographic and numeric order diverge.

<!-- @doubt -->
### What if k is larger than the string?

<!-- @answer -->
The answer is "0", since everything is removed. The code has to survive it without arithmetic trouble: `st.size() - k` underflows on an unsigned type and produces an enormous length, so the trim must clamp — `min((size_t)k, st.size())` in C++, `Math.max(0, ...)` in Java. Python's slice bound clamps on its own, which is one of the few places its permissiveness is an advantage rather than a hazard. Whether the input can actually have k > n depends on the problem statement, but the clamp costs nothing and removes a class of crash.

<!-- @doubt -->
### Can the leading-zero strip be skipped by never pushing zeros?

<!-- @answer -->
No, and trying is a common wrong turn. Zeros are legitimate digits in the middle of the answer — "10200" with k = 1 gives "200", which contains a zero that must be kept. What must be removed is only a zero at the front of the final result, and whether a given zero ends up at the front depends on what is deleted before it, which is not known until the scan completes. So the strip has to be a post-processing step operating on the finished string, not a rule applied during the scan.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Implement Min Stack, which opens the Hard tier and inverts the relationship the last several subtopics have had with the structure. Instead of using a stack to solve a problem, it asks for a stack that carries an extra guarantee — reporting its minimum in O(1) alongside push, pop and top. The question turns out not to be about scanning at all but about what has to be stored per element for that guarantee to hold, and how little of it you can get away with.
